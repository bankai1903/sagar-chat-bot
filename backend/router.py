import json
import re
from typing import List, Dict, Any, Optional
from backend.config import DOMAINS, LLM_MODEL, get_gemini_client

def keyword_route(query: str) -> Dict[str, Any]:
    """Fast rule-based keyword matcher for instant routing and offline fallback."""
    lower_query = query.lower()
    scores = {d: sum(1 for kw in info["keywords"] if kw in lower_query) for d, info in DOMAINS.items()}
    sorted_domains = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_domain, best_score = sorted_domains[0]
    active_domains = [d for d, s in sorted_domains if s > 0]
    
    if best_score > 0:
        return {
            "primary_domain": best_domain,
            "target_domains": active_domains if len(active_domains) <= 3 else active_domains[:2],
            "is_college_related": True,
            "confidence": min(0.5 + (best_score * 0.1), 0.95),
            "reasoning": f"Keyword matches in {best_domain}"
        }

    # Common greetings
    greetings = ("hi", "hello", "hey", "good morning", "good evening", "namaste", "who are you")
    if any(lower_query.strip().startswith(g) for g in greetings):
        return {
            "primary_domain": "general",
            "target_domains": ["general"],
            "is_college_related": True,
            "confidence": 0.9,
            "reasoning": "Conversational greeting"
        }

    # If no keywords matched, classify as out of scope
    return {
        "primary_domain": "out_of_scope",
        "target_domains": [],
        "is_college_related": False,
        "confidence": 0.2,
        "reasoning": "No college keywords matched"
    }

def route_query_gemini(query: str, client: Any) -> Dict[str, Any]:
    """Intelligent LLM-based query routing using Google Gemini."""
    domain_descriptions = "\n".join([f"- {k} ({v['name']}): {v['description']}" for k, v in DOMAINS.items()])
    system_prompt = f"""You are the Master Query Router for SISTec College Multi-RAG Chatbot.
Available Domains:
{domain_descriptions}
- general: For greetings/introductions.
- out_of_scope: Questions completely unrelated to college or education.

Respond ONLY with valid JSON:
{{"primary_domain": "key", "target_domains": ["key1"], "is_college_related": true, "confidence": 0.95, "reasoning": "text"}}
"""
    try:
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=[system_prompt, f"User Query: {query}"]
        )
        text = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(text)
    except Exception as e:
        fb = keyword_route(query)
        fb["reasoning"] += f" (LLM route fallback: {e})"
        return fb

def route_query(query: str) -> Dict[str, Any]:
    """Fast keyword routing first (sub-millisecond, zero quota). LLM fallback only if ambiguous."""
    res = keyword_route(query)
    if res["primary_domain"] != "out_of_scope":
        return res
    client = get_gemini_client()
    return route_query_gemini(query, client) if client else res
