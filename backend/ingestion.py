import os
import re
from pathlib import Path
from typing import List, Dict, Any
import chromadb
from chromadb.utils import embedding_functions
from pypdf import PdfReader

from backend.config import CHROMA_PERSIST_DIR, DATA_DIR, DOMAINS

# Initialize persistent Chroma client
CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=str(CHROMA_PERSIST_DIR))

# Use default local ONNX MiniLM embedding for ultra-fast, local, zero-quota vector indexing
default_ef = embedding_functions.DefaultEmbeddingFunction()

def get_collection_name(domain_key: str) -> str:
    """Return collection name for a given domain."""
    return f"college_{domain_key}"

def get_or_create_collection(domain_key: str):
    """Retrieve or create the ChromaDB collection for a domain."""
    collection_name = get_collection_name(domain_key)
    return chroma_client.get_or_create_collection(
        name=collection_name,
        embedding_function=default_ef,
        metadata={"domain": domain_key, "domain_name": DOMAINS.get(domain_key, {}).get("name", domain_key)}
    )

def extract_text_from_file(file_path: Path) -> str:
    """Extract plain text from txt, md, or pdf files."""
    suffix = file_path.suffix.lower()
    if suffix in [".txt", ".md"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    elif suffix == ".pdf":
        reader = PdfReader(str(file_path))
        pages_text = []
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages_text.append(f"--- Page {page_idx + 1} ---\n" + text.strip())
        return "\n\n".join(pages_text)
    else:
        raise ValueError(f"Unsupported file format: {suffix}")

def chunk_text(text: str, chunk_size: int = 1100, chunk_overlap: int = 150) -> List[Dict[str, Any]]:
    """
    Split text into semantically aware overlapping chunks.
    Preserves heading and section context where possible.
    """
    # Split primarily by double newlines (paragraphs/markdown sections)
    raw_sections = [s.strip() for s in re.split(r'\n{2,}', text) if s.strip()]
    chunks = []
    current_chunk = ""
    current_heading = "General"

    for section in raw_sections:
        # Detect section title (e.g. ## Overview)
        lines = section.split("\n")
        first_line = lines[0].strip()
        if first_line.startswith("#"):
            current_heading = first_line.lstrip("#").strip()

        if len(current_chunk) + len(section) <= chunk_size:
            current_chunk = (current_chunk + "\n\n" + section).strip()
        else:
            if current_chunk:
                chunks.append({
                    "text": current_chunk,
                    "heading": current_heading
                })
            # Break oversized sections with step slice
            if len(section) > chunk_size:
                step = chunk_size - chunk_overlap
                for i in range(0, len(section), step):
                    chunks.append({"text": section[i:i + chunk_size], "heading": current_heading})
                current_chunk = ""
            else:
                current_chunk = section

    if current_chunk:
        chunks.append({
            "text": current_chunk,
            "heading": current_heading
        })

    return chunks

def index_file(file_path: Path, domain_key: str) -> int:
    """Index a single document into the appropriate domain vector store."""
    if domain_key not in DOMAINS:
        raise ValueError(f"Unknown domain: {domain_key}")
    
    collection = get_or_create_collection(domain_key)
    text = extract_text_from_file(file_path)
    if not text.strip():
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    # Delete existing entries for this file to prevent duplicate chunks
    try:
        collection.delete(where={"source_file": file_path.name})
    except Exception:
        pass

    documents = [c["text"] for c in chunks]
    metadatas = [{
        "domain": domain_key,
        "domain_name": DOMAINS[domain_key]["name"],
        "source_file": file_path.name,
        "heading": c["heading"],
        "chunk_index": idx
    } for idx, c in enumerate(chunks)]
    ids = [f"{domain_key}_{file_path.stem}_{idx}" for idx in range(len(chunks))]

    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    return len(documents)

def index_all_domains(data_dir: Path = DATA_DIR) -> Dict[str, int]:
    """Scan and index all files in the domain directories."""
    summary = {}
    for domain_key, info in DOMAINS.items():
        domain_folder = data_dir / info["folder"]
        domain_folder.mkdir(parents=True, exist_ok=True)
        total_chunks = 0
        
        for file_path in domain_folder.glob("*"):
            if file_path.suffix.lower() in [".txt", ".md", ".pdf"]:
                chunks_added = index_file(file_path, domain_key)
                total_chunks += chunks_added
                
        summary[domain_key] = total_chunks
    return summary

def get_indexed_documents() -> List[Dict[str, Any]]:
    """Return all currently indexed files grouped by domain."""
    docs = []
    for domain_key, info in DOMAINS.items():
        domain_folder = DATA_DIR / info["folder"]
        if domain_folder.exists():
            for file_path in domain_folder.glob("*"):
                if file_path.suffix.lower() in [".txt", ".md", ".pdf"]:
                    collection = get_or_create_collection(domain_key)
                    count = collection.count()
                    docs.append({
                        "domain": domain_key,
                        "domain_name": info["name"],
                        "file_name": file_path.name,
                        "size_bytes": file_path.stat().st_size,
                        "modified_at": file_path.stat().st_mtime,
                        "total_domain_chunks": count
                    })
    return docs

