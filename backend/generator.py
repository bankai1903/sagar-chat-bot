from typing import List, Dict, Any, Optional
from backend.config import LLM_MODEL, get_gemini_client

SYSTEM_INSTRUCTIONS = """You are the official AI Assistant for Sagar Institute of Science and Technology (SISTec), Bhopal.
Base answers strictly on the provided Context. If not found in context, clearly state that official records don't contain it and give contact: +91 9109975760 / admissions@sistec.ac.in.
Format responses cleanly with Markdown."""

def get_greeting() -> str:
    """Return initial welcome message and domain guide."""
    return (
        "👋 **Hello! Welcome to SISTec (Sagar Institute of Science and Technology), Bhopal.**\n\n"
        "I am your Multi-RAG Campus Assistant. Ask me about:\n"
        "- 🎓 **Academics**: B.Tech branches, M.Tech, MBA, Pharmacy, syllabus & exams.\n"
        "- 💰 **Admissions & Fees**: Eligibility, MP DTE counseling, scholarships & fees.\n"
        "- 🏢 **Campus & Hostels**: Hostel fees, mess, 100+ bus routes across Bhopal.\n"
        "- 💼 **Placements**: Top recruiters (TCS, Cisco, Amazon), packages.\n"
        "- 📢 **Administration & Contacts**: Gandhi Nagar & Ratibad campus helplines.\n\n"
        "*How can I assist you today?*"
    )

def get_fallback(reason: str = "out_of_scope") -> str:
    """Return fallback message when query is out of scope or records not found."""
    if reason == "out_of_scope":
        return (
            "I am specialized specifically as the SISTec College Assistant. "
            "I can only help with college queries such as admissions, syllabus, "
            "fees, hostels, campus facilities, and placements."
        )
    return (
        "I could not locate specific records for this inquiry in the college database. "
        "Please contact the SISTec Admission & Info Cell at **+91 9109975760** "
        "or email **admissions@sistec.ac.in**."
    )

def generate_answer(
    query: str,
    context: str,
    chat_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """Synthesize grounded answer using Gemini LLM if configured, else return direct context."""
    client = get_gemini_client()
    if not client:
        return f"### Information from SISTec Records:\n\n{context}"

    history_str = "\n".join(f"{m['role'].capitalize()}: {m['content']}" for m in (chat_history or [])[-4:])
    full_prompt = (
        f"{SYSTEM_INSTRUCTIONS}\n\n"
        f"Context from SISTec Records:\n\"\"\"\n{context}\n\"\"\"\n\n"
        f"Recent History:\n{history_str}\n\n"
        f"User Question: {query}\n\n"
        f"Answer:"
    )
    
    try:
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=full_prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"### Information from SISTec Records:\n\n{context}\n\n*(Gemini API: {e})*"
