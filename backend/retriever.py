from typing import List, Dict, Any, Tuple
from backend.config import DOMAINS
from backend.ingestion import get_or_create_collection

def retrieve_domain_context(query: str, domain_key: str, n_results: int = 3) -> List[Dict[str, Any]]:
    """Retrieve top-K semantic chunks from a specific domain collection."""
    if domain_key not in DOMAINS:
        return []

    collection = get_or_create_collection(domain_key)
    if collection.count() == 0:
        return []

    actual_n = min(n_results, collection.count())
    results = collection.query(
        query_texts=[query],
        n_results=actual_n
    )

    chunks = []
    if results and "documents" in results and results["documents"]:
        docs = results["documents"][0]
        metadatas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)

        for doc, meta, dist in zip(docs, metadatas, distances):
            chunks.append({
                "text": doc,
                "domain": domain_key,
                "domain_name": meta.get("domain_name", DOMAINS[domain_key]["name"]),
                "source_file": meta.get("source_file", "unknown"),
                "heading": meta.get("heading", "General"),
                "distance": float(dist) if dist is not None else 0.0
            })

    return chunks

def multi_domain_retrieve(query: str, target_domains: List[str], top_per_domain: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Retrieve and aggregate relevant context across multiple routed domains.
    Returns:
      - formatted_context_str: Clean string passed to the LLM
      - raw_citations: Structured citations metadata for UI rendering
    """
    all_chunks: List[Dict[str, Any]] = []
    
    # If general or out_of_scope, no domain retrieval needed
    if not target_domains or target_domains == ["general"] or target_domains == ["out_of_scope"]:
        return "", []

    per_domain = top_per_domain if len(target_domains) <= 2 else 3
    for domain_key in target_domains:
        chunks = retrieve_domain_context(query, domain_key, n_results=per_domain)
        all_chunks.extend(chunks)

    if not all_chunks:
        return "", []

    # Sort chunks by relevance distance (lower distance = higher semantic similarity)
    all_chunks.sort(key=lambda x: x.get("distance", 1.0))
    # Cap total chunks to 8 for rich, non-diluted LLM grounding
    all_chunks = all_chunks[:8]

    # Format text for LLM injection
    formatted_blocks = []
    citations = []

    for idx, c in enumerate(all_chunks, 1):
        block = f"[Document {idx} | Domain: {c['domain_name']} | File: {c['source_file']} | Section: {c['heading']}]\n{c['text']}"
        formatted_blocks.append(block)
        citations.append({
            "id": idx,
            "domain": c["domain"],
            "domain_name": c["domain_name"],
            "source_file": c["source_file"],
            "heading": c["heading"],
            "snippet": c["text"][:160] + "..." if len(c["text"]) > 160 else c["text"]
        })

    formatted_context_str = "\n\n".join(formatted_blocks)
    return formatted_context_str, citations

