import re
from typing import List, Dict, Any, Tuple
from backend.config import DOMAINS
from backend.ingestion import get_or_create_collection

STOPWORDS = {
    "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
    "the", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "can", "could", "should", "would", "will", "shall",
    "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "about",
    "tell", "give", "show", "me", "you", "your", "sistec", "bhopal", "college", "institute"
}

def extract_query_keywords(query: str) -> List[str]:
    words = re.findall(r'[a-zA-Z0-9]+', query.lower())
    return [w for w in words if len(w) >= 3 and w not in STOPWORDS]

def score_chunk_hybrid(query: str, chunk_text: str, heading: str, raw_dist: float) -> float:
    """
    Hybrid scoring: combines dense vector distance with sparse lexical keyword matching.
    Gives strong priority to exact matches of proper nouns (faculty names, branches, labs).
    """
    text_lower = (chunk_text or "").lower()
    heading_lower = (heading or "").lower()
    combined = heading_lower + " " + text_lower
    
    keywords = extract_query_keywords(query)
    if not keywords:
        return raw_dist
        
    boost = 0.0
    clean_q = re.sub(r'[^a-zA-Z0-9\s]', '', query.lower()).strip()
    if len(clean_q) > 4 and clean_q in text_lower:
        boost += 0.8
        
    matches = sum(1 for kw in keywords if kw in combined)
    if matches > 0:
        boost += (matches / len(keywords)) * 0.6
        
    heading_matches = sum(1 for kw in keywords if kw in heading_lower)
    if heading_matches > 0:
        boost += 0.3
        
    return max(0.01, raw_dist - boost)

def retrieve_domain_context(query: str, domain_key: str, n_results: int = 5) -> List[Dict[str, Any]]:
    """Retrieve top-K semantic chunks from a specific domain collection using Hybrid Search."""
    if domain_key not in DOMAINS:
        return []

    collection = get_or_create_collection(domain_key)
    if collection.count() == 0:
        return []

    # Fetch more candidates for lexical re-ranking (broad pool to prevent false misses)
    candidate_n = min(max(n_results * 8, 40), collection.count())
    results = collection.query(
        query_texts=[query],
        n_results=candidate_n
    )

    chunks = []
    if results and "documents" in results and results["documents"]:
        docs = results["documents"][0]
        metadatas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)

        for doc, meta, dist in zip(docs, metadatas, distances):
            if not doc:
                continue
            meta = meta or {}
            raw_d = float(dist) if dist is not None else 0.0
            heading = meta.get("heading", "General") or "General"
            hybrid_d = score_chunk_hybrid(query, doc, heading, raw_d)
            
            chunks.append({
                "text": doc,
                "domain": domain_key,
                "domain_name": meta.get("domain_name", DOMAINS[domain_key]["name"]),
                "source_file": meta.get("source_file", "unknown"),
                "heading": heading,
                "distance": hybrid_d,
                "raw_distance": raw_d
            })

    # Sort candidates by hybrid score and take top n_results
    chunks.sort(key=lambda x: x["distance"])
    return chunks[:n_results]

def multi_domain_retrieve(query: str, target_domains: List[str], top_per_domain: int = 6) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Retrieve and aggregate relevant context across multiple routed domains using Hybrid Search.
    Returns:
      - formatted_context_str: Clean string passed to the LLM
      - raw_citations: Structured citations metadata for UI rendering
    """
    all_chunks: List[Dict[str, Any]] = []
    
    # If general or out_of_scope, no domain retrieval needed
    if not target_domains or target_domains == ["general"] or target_domains == ["out_of_scope"]:
        return "", []

    per_domain = top_per_domain if len(target_domains) <= 2 else 4
    for domain_key in target_domains:
        chunks = retrieve_domain_context(query, domain_key, n_results=per_domain)
        all_chunks.extend(chunks)

    if not all_chunks:
        return "", []

    # Sort chunks by hybrid distance (lower distance = higher relevance)
    all_chunks.sort(key=lambda x: x.get("distance", 1.0))
    # Cap total chunks to 12 for rich, comprehensive LLM grounding
    all_chunks = all_chunks[:12]

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
