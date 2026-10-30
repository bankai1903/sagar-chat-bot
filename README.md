# SISTec Campus Multi-RAG Chatbot System

A domain-partitioned **Multi-RAG (Retrieval-Augmented Generation)** conversational AI system designed specifically for **Sagar Institute of Science and Technology (SISTec), Bhopal**.

Built for College Minor / Major Project demonstration, featuring **LangGraph (StateGraph Workflow)**, **FastAPI**, **ChromaDB**, **Google Gemini**, and **React + Tailwind CSS**.

---

## 🏛️ LangGraph Agentic Multi-RAG Pipeline

The backend implements a stateful **LangGraph StateGraph** that manages conversation flow, intelligent domain routing, vector retrieval, document relevance grading, and LLM synthesis:

```
                      [ User Query ]
                            │
                            ▼
                  ┌──────────────────┐
                  │ 1. router_node   │  <-- Classifies Domain Intent
                  └─────────┬────────┘
                            │
         Conditional Routing (Academics / Hostels / Placements / General)
         ┌──────────────────┼─────────────────────────┐
         ▼                  ▼                         ▼
   [ Greeting ]      [ Out of Scope ]           [ College Query ]
         │                  │                         │
         ▼                  ▼                         ▼
  (Direct Answer)   (Polite Refusal)        ┌──────────────────┐
                                            │ 2. retrieve_node │  <-- Multi-Vector Store Fetch
                                            └─────────┬────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────────┐
                                            │ 3. grade_docs_node   │  <-- (Agentic RAG) Checks if chunks
                                            └─────────┬────────────┘      actually answer the query!
                                                      │
                                            ┌─────────┴─────────┐
                                            ▼                   ▼
                                       (Relevant)         (Not Relevant)
                                            │                   │
                                            ▼                   ▼
                                 ┌──────────────────┐   ┌───────────────────┐
                                 │ 4. generate_node │   │ 5. fallback_node  │
                                 └──────────────────┘   └───────────────────┘
```

### Our Multi-RAG Solution:
The system segregates university data into **5 specialized vector stores**:
1. 🎓 **Academics & Examination**: B.Tech, M.Tech, MBA, Pharmacy courses, RGPV syllabus, grading, attendance norms.
2. 💰 **Admissions & Fees**: Eligibility criteria, MP DTE counseling, scholarships, freeships, admission contacts.
3. 🏢 **Hostels & Campus Facilities**: Hostel fees, room occupancy, mess rules, 100+ bus routes across Bhopal, sports, library.
4. 💼 **Training & Placements (T&P)**: Placement records (~96%), highest package (₹21-22 LPA), recruiters (TCS, Cisco, Amazon, etc.).
5. 📢 **Administration & Contacts**: Gandhi Nagar & Ratibad campus locations, phone helplines, anti-ragging & grievance cells.

---

## ⚙️ Architecture Pipeline

```
                       [ Student / User Query ]
                                  │
                                  ▼
                     [ 🧠 Query Router Agent ]
        (Determines domain intent: Academics, Admissions, Hostels, etc.)
                                  │
         ┌──────────────┬─────────┴────────┬──────────────┬──────────────┐
         ▼              ▼                  ▼              ▼              ▼
   [Academics DB] [Admissions DB]   [Hostel DB]    [Placement DB] [Admin DB]
         │              │                  │              │              │
         └──────────────┴─────────┬────────┴──────────────┴──────────────┘
                                  ▼
                   [ 🔍 Multi-Domain Context Retrieval ]
               (Top-K semantic similarity matching in ChromaDB)
                                  │
                                  ▼
                    [ 🤖 Gemini LLM Synthesis ]
        (Grounded answer generation + Strict zero-hallucination guardrails)
                                  │
                                  ▼
              [ 💬 Modern React Chat UI with Verified Sources ]
```

---

## 🚀 How to Run the Project

### 1. Configure Gemini API Key (Optional but Recommended)
Open the `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash
```
> *Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).*  
> *(If no key is configured, the system uses fast offline extractive summaries).*

### 2. Start the Backend (Terminal 1)
Double click `run_backend.bat` or run:
```bash
.venv\Scripts\activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs available at: `http://127.0.0.1:8000/docs`

### 3. Start the Frontend (Terminal 2)
Double click `run_frontend.bat` or run:
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 📁 Project Structure

```
Minor/
├── backend/
│   ├── config.py           # Configuration, domains, keywords, and model settings
│   ├── ingestion.py        # PDF/Text loader, chunking & ChromaDB vector store builder
│   ├── router.py           # Multi-RAG query router (keyword & Gemini semantic classifier)
│   ├── retriever.py        # Semantic vector similarity retriever & citation formatter
│   ├── generator.py        # Answer generator with guardrails against hallucination
│   ├── main.py             # FastAPI server exposing /api/chat, /api/upload, /api/documents
│   └── requirements.txt    # Python dependencies
├── data/                   # Domain partitioned knowledge documents
│   ├── academics/          # SISTec academics, syllabus, RGPV affiliation
│   ├── admissions/         # Admission process, eligibility, fees & scholarships
│   ├── hostels/            # Campus facilities, hostel fees, mess, bus routes
│   ├── placements/         # T&P statistics, recruiters, packages
│   └── administration/     # Campus addresses, phone numbers, helplines
├── frontend/               # Modern React + Vite + Tailwind CSS interface
│   ├── src/
│   │   ├── App.jsx         # Chat view, Document Manager, Architecture Explorer
│   │   ├── index.css       # Styling & scrollbars
│   │   └── main.jsx
│   └── vite.config.js      # Vite proxy to backend API
├── chroma_db/              # Persistent vector databases for each domain
├── run_backend.bat         # 1-Click backend launcher
├── run_frontend.bat        # 1-Click frontend launcher
├── .env                    # Environment variables (GEMINI_API_KEY)
└── README.md
```

---

## 🎯 Key Features for Viva / Project Evaluation

1. **Intelligent Domain Routing**: Automatically identifies whether an inquiry is about placements, hostels, admissions, or academics.
2. **Multi-Domain Decomposition**: Questions spanning multiple domains (e.g. *"What is the hostel fee and placement packages?"*) retrieve from both stores simultaneously.
3. **Verifiable Citations**: Every answer provides clickable source cards displaying the exact document and section referenced.
4. **Live Document Ingestion**: Admin panel allows uploading new college circulars or syllabus PDFs which are chunked and indexed on-the-fly.
5. **Zero Hallucination Guardrails**: Refuses to make up fake statistics if information is not found in official documents, citing official contact numbers instead.

