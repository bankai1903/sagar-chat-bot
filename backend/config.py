import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Gemini & Model Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-flash-lite-latest")

_gemini_client = None
def get_gemini_client():
    global _gemini_client
    if _gemini_client is None and GEMINI_API_KEY:
        from google import genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    return _gemini_client

# Paths
DATA_DIR = BASE_DIR / "data"
CHROMA_PERSIST_DIR = BASE_DIR / "chroma_db"

# Multi-RAG Domains Definition
DOMAINS = {
    "academics": {
        "name": "Academics & Examination",
        "folder": "academics",
        "description": "Courses, B.Tech/M.Tech/MBA/Pharmacy branches, syllabus, RGPV affiliation, academic calendar, exam rules, attendance guidelines, labs, semester modules, faculty members, professors, HODs, vision, mission, objectives, colleges, SISTec.",
        "keywords": ["syllabus", "course", "courses", "btech", "b.tech", "mtech", "m.tech", "mba", "pharmacy", "bpharm", "b.pharm", "mpharm", "m.pharm", "rgpv", "exam", "exams", "examination", "attendance", "credits", "branch", "branches", "department", "semester", "curriculum", "subject", "subjects", "degree", "lab", "labs", "laboratory", "laboratories", "computer science", "cse", "modules", "faculty", "faculties", "professor", "professors", "hod", "head of department", "teacher", "teachers", "staff", "dr", "dr.", "vision", "mission", "objective", "objectives", "why choose", "values", "pillars", "tenets", "principal", "director", "vice principal", "manish billore", "jyoti deshmukh", "kuldeep ganju", "abhishek choubey", "swati saxena", "dinesh ramchandani", "jitendra bajaj", "edc", "entrepreneurship development cell", "iic", "institution innovation council", "sistec gandhi nagar", "sistec gn", "colleges", "sistec-r", "sistec r", "sagar institute of science technology and research", "ratibad", "sistec-e", "sistec e", "sagar institute of science technology and engineering", "power systems", "teqip", "siptec", "siptec gn", "sagar institute of pharmacy and technology", "pci", "pharmacy council of india", "pharmaceutics", "pharmaceutical chemistry", "know your medicine"]
    },
    "admissions": {
        "name": "Admissions & Fees",
        "folder": "admissions",
        "description": "Eligibility criteria, MP DTE counseling, CLC rounds, tuition fee structure, caution money, scholarships, freeships, admission helplines.",
        "keywords": ["admission", "admissions", "eligibility", "eligible", "fee", "fees", "tuition", "counseling", "dte", "clc", "scholarship", "scholarships", "freeship", "cutoff", "12th marks", "lateral entry", "apply", "form", "seats"]
    },
    "hostels": {
        "name": "Hostels & Campus Facilities",
        "folder": "hostels",
        "description": "Hostel accommodation, occupancy types, mess menu & food, curfew timings, bus routes & transport, sports grounds, library, medical aid, student clubs, SAC, IEEE, CSI, SAE, fests, hackathons.",
        "keywords": ["hostel", "hostels", "mess", "food", "dining", "bus", "buses", "transport", "room", "rooms", "curfew", "warden", "library", "sports", "gym", "gymnasium", "medical", "hospital", "doctor", "campus facility", "amenities", "wifi", "internet", "club", "clubs", "sac", "ieee", "csi", "sae", "student activity council", "fest", "fiesta", "jalsa", "garba", "hackathon", "events", "celebration", "nss", "iic", "cultural"]
    },
    "placements": {
        "name": "Training & Placements (T&P)",
        "folder": "placements",
        "description": "Placement statistics, packages (highest & average), hiring companies, campus recruitment eligibility, training programs, C2C, internships, alumni.",
        "keywords": ["placement", "placements", "package", "packages", "salary", "lpa", "recruiter", "recruiters", "company", "companies", "recruit", "recruiting", "hire", "hiring", "interview", "interviews", "internship", "internships", "training", "c2c", "jobs", "offers", "highest", "average package", "placed", "campus to corporate"]
    },
    "administration": {
        "name": "Administration & Contacts",
        "folder": "administration",
        "description": "Campus addresses (Gandhi Nagar & Ratibad), contact numbers, email IDs, grievance cell, anti-ragging committee, leadership, founders, student support, faculty directory, Sagar Group history, ventures, industries, vision, mission, advisory board.",
        "keywords": ["address", "contact", "contacts", "phone", "mobile", "number", "email", "helpline", "location", "where is", "reach", "campus", "principal", "director", "chairman", "leader", "leaders", "founder", "founders", "anti-ragging", "ragging", "grievance", "complaint", "ratibad", "gandhi nagar", "office", "timings", "faculty", "professor", "professors", "hod", "dr", "dr.", "sagar group", "sudhir kumar agrawal", "smpl", "sagar yarn", "sagar manufacturers", "sagar rice", "sagar nutriments", "agrawal builders", "sps", "sagar public school", "smh", "sagar hospital", "abhay sagar foundation", "svn", "sagar vidya niketan", "about us", "conglomerate", "ventures", "vision", "mission", "objective", "objectives", "managing director", "vice principal", "manish billore", "jyoti deshmukh", "kuldeep ganju", "abhishek choubey", "swati saxena", "dinesh ramchandani", "jitendra bajaj", "our leaders", "advisory board", "advisory", "advisors", "advisor", "board member", "board members", "sanjeev somasundaram", "g s javed", "gaurav ghelani", "anuja sharma", "anuj trivedi", "kapil kumar agarwal", "mukesh jain", "parag trivedi", "priya singh", "sumit chowdhury", "sanjeev sawal", "edc", "entrepreneurship development cell", "iic", "institution innovation council", "sistec gandhi nagar", "sistec gn", "colleges", "sistec-r", "sistec r", "sagar institute of science technology and research", "sistec-e", "sistec e", "sagar institute of science technology and engineering", "teqip", "siptec", "siptec gn", "sagar institute of pharmacy and technology", "pci", "pharmacy council of india", "pharmacy", "bpharm", "b.pharm", "mpharm", "m.pharm", "pharmaceutics", "pharmaceutical chemistry", "know your medicine"]
    }
}
