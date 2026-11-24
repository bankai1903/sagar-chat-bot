from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from backend.config import DOMAINS
from backend.router import route_query
from backend.retriever import multi_domain_retrieve
from backend.generator import generate_answer, get_greeting, get_fallback

class MultiRAGState(TypedDict):
    query: str
    chat_history: Optional[List[Dict[str, str]]]
    forced_domain: Optional[str]
    routing: Dict[str, Any]
    context: str
    citations: List[Dict[str, Any]]
    documents_valid: bool
    answer: str

def route_node(state: MultiRAGState) -> Dict[str, Any]:
    forced = state.get("forced_domain")
    if forced and forced in DOMAINS:
        return {"routing": {"primary_domain": forced, "target_domains": [forced], "is_college_related": True, "confidence": 1.0}}
    return {"routing": route_query(state["query"].strip())}

def greeting_node(state: MultiRAGState) -> Dict[str, Any]:
    return {"answer": get_greeting(), "citations": []}

def retrieve_node(state: MultiRAGState) -> Dict[str, Any]:
    context, citations = multi_domain_retrieve(state["query"], state["routing"].get("target_domains", []), top_per_domain=5)
    return {"context": context, "citations": citations}

def grade_documents_node(state: MultiRAGState) -> Dict[str, Any]:
    return {"documents_valid": bool(state.get("context", "").strip() and state.get("citations"))}

def generate_node(state: MultiRAGState) -> Dict[str, Any]:
    return {"answer": generate_answer(state["query"], state["context"], state.get("chat_history"))}

def fallback_node(state: MultiRAGState) -> Dict[str, Any]:
    reason = "not_found" if state.get("routing", {}).get("is_college_related") else "out_of_scope"
    return {"answer": get_fallback(reason), "citations": []}

def route_decision(state: MultiRAGState) -> str:
    r = state.get("routing", {})
    if r.get("primary_domain") == "general":
        return "greeting"
    return "retrieve" if r.get("is_college_related", True) and r.get("primary_domain") != "out_of_scope" else "fallback"

def grade_decision(state: MultiRAGState) -> str:
    return "generate" if state.get("documents_valid") else "fallback"

def create_multirag_graph():
    wf = StateGraph(MultiRAGState)
    wf.add_node("router", route_node)
    wf.add_node("greeting", greeting_node)
    wf.add_node("retrieve", retrieve_node)
    wf.add_node("grade_documents", grade_documents_node)
    wf.add_node("generate", generate_node)
    wf.add_node("fallback", fallback_node)

    wf.set_entry_point("router")
    wf.add_conditional_edges("router", route_decision, {"greeting": "greeting", "fallback": "fallback", "retrieve": "retrieve"})
    wf.add_edge("retrieve", "grade_documents")
    wf.add_conditional_edges("grade_documents", grade_decision, {"generate": "generate", "fallback": "fallback"})
    wf.add_edge("generate", END)
    wf.add_edge("greeting", END)
    wf.add_edge("fallback", END)
    return wf.compile()

langgraph_app = create_multirag_graph()
