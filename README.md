# NeuraDesk (Python-RAG)

NeuraDesk is a modern, high-performance Retrieval-Augmented Generation (RAG) platform. It allows users to upload custom documents and chat with a Large Language Model (LLM) that has exact knowledge of those documents.

Built with a **Next.js** frontend and a **FastAPI** backend, the system utilizes **Qdrant** for vector search, **PostgreSQL** for metadata tracking, and **LangGraph** for AI orchestration.

---

## 🚀 Features

- **Dynamic Premium UI**: A highly engaging, glassmorphic Next.js interface with micro-animations.
- **Diskless Ingestion**: Uploaded documents are parsed entirely in memory/temp-space and never saved to disk.
- **Multi-Format Support**: Ingests PDF (via PyMuPDF for robust extraction), Text, CSV, Excel (with safe file lock handling), Word, and JSON files seamlessly.
- **Agentic RAG Engine**: Utilizes LangGraph to power an advanced conversational and search pipeline, ensuring accurate answers with context citations.
- **Secure Multi-Tenancy**: Persistent Postgres storage and session-based authentication prevents data cross-contamination between different users.
- **Hybrid Search & Management**: You can query the entire knowledge base, or filter by specific uploaded documents.
- **Local Embeddings & High-Speed LLMs**: Generates semantic embeddings locally using `sentence-transformers` and queries via the lightning-fast Groq API (`llama-3.3-70b-versatile`).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS v4, custom CSS Keyframes, Glassmorphism
- **Language**: TypeScript

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI/LLM**: LangChain, LangGraph, Groq API
- **Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`)
- **Metadata Database**: PostgreSQL (via `asyncpg`)
- **Vector Database**: Qdrant (Dockerized)

---

## ⚙️ Quickstart Setup

### 1. Prerequisites
- Docker & Docker Compose (for PostgreSQL and Qdrant)
- Node.js (for Next.js frontend)
- Python 3.10+ and `uv` package manager (for FastAPI backend)

### 2. Infrastructure Setup
Start the local databases (Postgres and Qdrant) using Docker Compose:
```bash
docker-compose up -d
```

### 3. Backend Setup
1. Navigate to the `backend` directory.
2. Create a `.env` file based on `.env.example` (ensure `GROQ_API_KEY`, Postgres, and Qdrant variables are set).
3. Install dependencies and run the server:
```bash
cd backend
uv run python -m uvicorn api:app --reload
```
*The backend will be available at http://127.0.0.1:8000*

### 4. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
```bash
cd frontend
npm install
```
3. Run the development server:
```bash
npm run dev
```
*The UI will be available at http://localhost:3000*

---

## 📖 Further Reading
For a deep dive into the architecture, component interaction, and design decisions, please read the [DOCUMENTATION.md](./DOCUMENTATION.md) file.
