@echo off
echo ========================================================
echo   Starting SISTec Multi-RAG Backend (FastAPI + ChromaDB)
echo ========================================================
cd /d "%~dp0"
call .venv\Scripts\activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause

