# ==============================================================================
# Stage 1: Build React Frontend Static Assets
# ==============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Build static bundle to /app/frontend/dist
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Python FastAPI Multi-RAG Production Server
# ==============================================================================
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MALLOC_ARENA_MAX=2 \
    PORT=10000

WORKDIR /app

# Install system utilities (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Pre-download and cache Chroma ONNX embedding model during build (prevents runtime OOM on 512MB free tier)
RUN python -c "import chromadb.utils.embedding_functions as ef; ef.DefaultEmbeddingFunction()(['warmup'])"

# Copy backend application source code, college knowledge data & pre-built vector DB
COPY backend/ ./backend/
COPY data/ ./data/
COPY chroma_db/ ./chroma_db/

# Copy built frontend assets from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose production ports (Render uses 10000 by default)
EXPOSE 10000 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

# Launch FastAPI app with dynamic port binding (Render/Railway compatible)
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
