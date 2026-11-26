import os
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from backend.config import DOMAINS, DATA_DIR, GEMINI_API_KEY
from backend.graph import langgraph_app
from backend.ingestion import (
    index_all_domains,
    index_file,
    get_indexed_documents,
    get_or_create_collection
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for info in DOMAINS.values():
        (DATA_DIR / info["folder"]).mkdir(parents=True, exist_ok=True)
    try:
        total_existing = sum(get_or_create_collection(d).count() for d in DOMAINS)
        print(f"INFO: ChromaDB initialized with {total_existing} chunks across {len(DOMAINS)} domains.")
    except Exception as e:
        print(f"WARNING: ChromaDB check encountered: {e}")
    # Yield immediately so Uvicorn opens port within < 1 second and Render healthcheck passes
    yield

app = FastAPI(
    title="SISTec Multi-RAG College Chatbot API",
    description="Multi-domain RAG system for Sagar Institute of Science and Technology, Bhopal",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    chat_history: Optional[List[ChatMessage]] = None
    forced_domain: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "langgraph_workflow_active": True,
        "gemini_api_configured": bool(GEMINI_API_KEY),
        "total_domains": len(DOMAINS)
    }

@app.get("/api/domains")
def get_domains():
    """Return all configured domains with chunk counts."""
    result = []
    for domain_key, info in DOMAINS.items():
        coll = get_or_create_collection(domain_key)
        result.append({
            "key": domain_key,
            "name": info["name"],
            "description": info["description"],
            "total_chunks": coll.count()
        })
    return result

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    """
    Main Multi-RAG chat endpoint powered by LangGraph StateGraph:
    1. route_node -> classifies domain intent
    2. conditional edge -> greeting / retrieve / fallback
    3. retrieve_node -> fetches domain vector chunks from ChromaDB
    4. grade_documents_node -> validates document relevance
    5. generate_node -> synthesizes grounded answer with citations
    """
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    history_dicts = [{"role": m.role, "content": m.content} for m in req.chat_history] if req.chat_history else []

    # Execute LangGraph Workflow
    final_state = langgraph_app.invoke({
        "query": query,
        "chat_history": history_dicts,
        "forced_domain": req.forced_domain,
        "routing": {},
        "context": "",
        "citations": [],
        "documents_valid": False,
        "answer": ""
    })

    return {
        "answer": final_state.get("answer", ""),
        "routing": final_state.get("routing", {}),
        "citations": final_state.get("citations", []),
        "workflow": "LangGraph StateGraph"
    }

@app.get("/api/documents")
def list_documents():
    """Get list of all documents stored across all domains."""
    return get_indexed_documents()

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    domain: str = Form(...)
):
    """Upload a new PDF or TXT document into a specified domain index."""
    if domain not in DOMAINS:
        raise HTTPException(status_code=400, detail=f"Invalid domain '{domain}'. Must be one of {list(DOMAINS.keys())}")

    filename = Path(file.filename).name
    ext = Path(filename).suffix.lower()
    if ext not in [".txt", ".md", ".pdf"]:
        raise HTTPException(status_code=400, detail="Only .pdf, .txt, and .md files are supported.")

    target_dir = DATA_DIR / DOMAINS[domain]["folder"]
    target_dir.mkdir(parents=True, exist_ok=True)
    target_file = target_dir / filename

    with open(target_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Index newly saved file into ChromaDB
    chunks_count = index_file(target_file, domain)

    return {
        "status": "success",
        "file_name": filename,
        "domain": domain,
        "domain_name": DOMAINS[domain]["name"],
        "indexed_chunks": chunks_count,
        "message": f"Successfully indexed '{filename}' with {chunks_count} chunks into {DOMAINS[domain]['name']}."
    }

@app.delete("/api/documents/{domain}/{filename}")
def delete_document(domain: str, filename: str):
    """Delete a document and remove its chunks from ChromaDB."""
    if domain not in DOMAINS:
        raise HTTPException(status_code=400, detail="Invalid domain.")

    target_file = DATA_DIR / DOMAINS[domain]["folder"] / filename
    if not target_file.exists():
        raise HTTPException(status_code=404, detail="File not found.")

    # Remove from disk
    os.remove(target_file)

    # Remove from Chroma
    coll = get_or_create_collection(domain)
    try:
        coll.delete(where={"source_file": filename})
    except Exception:
        pass

    return {
        "status": "success",
        "message": f"File '{filename}' deleted from {domain}."
    }

@app.post("/api/reindex")
def reindex_all():
    """Trigger full reindexing of all domain documents."""
    summary = index_all_domains()
    return {"status": "success", "summary": summary}

# =====================================================================
# Serve Built Frontend (All-in-One Single Container Deployment)
# =====================================================================
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Mount frontend static assets at root path
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")

@app.exception_handler(404)
async def custom_404_handler(request, exc):
    """Fallback handler to support SPA routing while preserving 404s for API."""
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": f"API endpoint '{request.url.path}' not found."})
    
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    return JSONResponse(status_code=404, content={"detail": "Page not found."})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)


