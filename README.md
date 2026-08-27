# Papertrail PDF Q&A

Papertrail is a source-backed PDF question-answering application. It turns uploaded PDFs into searchable chunks, retrieves the most relevant context with a local Qdrant collection, and asks Google Gemini to produce a concise answer grounded in that context.

The repository is intentionally split into two independently runnable services. The **frontend** is a Vite + React client with a focused document workspace. The **backend** is a FastAPI service responsible for PDF extraction, embeddings, Qdrant persistence, and Gemini requests.

## What changed

This version replaces the original notebook-style prototype with a runnable API and a connected frontend. The UI has been rebuilt around a warm neutral palette, dark ink typography, and one muted teal accent. It uses a restrained 60–30–10 color hierarchy with solid surfaces, crisp borders, and no decorative promotion. Generated metadata, tagger tooling, and third-party promotion have been removed.

The implementation now supports real PDF upload and indexing, document listing and deletion, document selection for grounded questions, source evidence display, backend health visibility, typed API responses, friendly validation errors, and a responsive document library.

## Architecture

| Area | Location | Responsibility |
|---|---|---|
| Frontend | `frontend/` | React interface, document library, chat composer, source display, API client |
| Backend | `backend/app.py` | FastAPI routes, PDF parsing, chunking, embedding, Qdrant storage, Gemini generation |
| Runtime data | `backend/data/` | Local PDFs, document registry, and Qdrant files; ignored by Git |
| Configuration | `frontend/.env.example`, `backend/.env.example` | Non-secret environment templates |

The request flow is: **upload PDF → extract page text → chunk text → create normalized embeddings → upsert chunks into Qdrant → retrieve relevant chunks → generate an answer with Gemini → return answer and source pages**.

## Requirements

You need Node.js 18 or newer, Python 3.10 or newer, and a Google Gemini API key. The first indexed document downloads the configured sentence-transformers model, so the backend requires internet access during the initial model setup. The default embedding model is `sentence-transformers/all-MiniLM-L6-v2` and the default generation model is `gemini-2.5-flash`.

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/aurangzeb200/-AI-Powered-PDF-Q-A-System-with-LangChain-Qdrant-Gemini.git
cd -AI-Powered-PDF-Q-A-System-with-LangChain-Qdrant-Gemini
```

### 2. Configure and start the backend

Create a virtual environment and install the pinned backend dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

Set `GOOGLE_API_KEY` in `backend/.env`. Do not commit that file. Start the API from the repository root:

```bash
set -a
source backend/.env
set +a
uvicorn app:app --app-dir backend --reload --port 8000
```

The backend is available at `http://localhost:8000`. Its health endpoint is `http://localhost:8000/health`.

### 3. Configure and start the frontend

In a second terminal, install the client dependencies and create the local API configuration:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. If the backend runs on another origin, set `VITE_API_URL` in `frontend/.env` to that origin and add the frontend origin to `CORS_ORIGINS` in the backend environment.

## Configuration

| Variable | Service | Default | Purpose |
|---|---|---|---|
| `GOOGLE_API_KEY` | Backend | None | Authenticates Gemini requests |
| `GEMINI_MODEL` | Backend | `gemini-2.5-flash` | Gemini model used for answers |
| `EMBEDDING_MODEL` | Backend | `sentence-transformers/all-MiniLM-L6-v2` | Sentence-transformers model for dense retrieval |
| `DATA_DIR` | Backend | `backend/data` | Local PDF, registry, and Qdrant storage directory |
| `CORS_ORIGINS` | Backend | `http://localhost:5173,http://localhost:8080` | Comma-separated browser origins allowed to call the API |
| `MAX_FILE_BYTES` | Backend | `10485760` | Maximum PDF size, 10 MiB by default |
| `PORT` | Backend | `8000` | Port used by the direct Python entry point |
| `VITE_API_URL` | Frontend | `http://localhost:8000` | Backend origin used by the browser client |

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns service status, configuration readiness, and document count |
| `GET` | `/documents` | Lists indexed documents |
| `POST` | `/upload` | Uploads and indexes one PDF using multipart field `file` |
| `DELETE` | `/documents/{document_id}` | Removes a document, its vectors, and its local PDF |
| `POST` | `/chat` | Retrieves context and generates an answer; body includes `query` and optional `document_id` |

Example upload request:

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@/path/to/document.pdf"
```

Example question:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the main subject of this document?","document_id":"your-document-id"}'
```

## Frontend commands

| Command | Result |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Type-checks and creates a production build |
| `npm run lint` | Runs ESLint across the frontend |
| `npm run preview` | Serves the production build locally |

## Backend behavior and limitations

PDFs are currently the supported upload format. The service extracts text page by page with `pypdf`, creates overlapping text chunks, and stores dense vectors in a local Qdrant database. The local database is persistent under `DATA_DIR`, but it is intentionally ignored by Git and should be backed up separately if the documents matter.

Answers require a configured Gemini key. Without that key, the health endpoint remains available and uploads can still be indexed, but the chat endpoint returns a clear configuration error instead of silently returning a fabricated answer. Scanned image-only PDFs require OCR, which is not included in this implementation.

## Verification

The frontend has been verified with a clean TypeScript build and ESLint run. The backend has been syntax-checked, imported through FastAPI’s test client, and exercised for health, document listing, invalid-upload validation, empty-chat validation, CORS preflight, and a real fixture PDF upload that returned an indexed document with page and chunk metadata.

To run a lightweight local check after starting the backend, use the following commands:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/documents
```

## Project layout

```text
.
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── data/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/Workspace.tsx
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## References

[1]: https://fastapi.tiangolo.com/ "FastAPI documentation"
[2]: https://qdrant.tech/documentation/ "Qdrant documentation"
[3]: https://pypi.org/project/pypdf/ "pypdf project page"
[4]: https://ai.google.dev/gemini-api/docs "Google Gemini API documentation"
[5]: https://www.sbert.net/ "Sentence Transformers documentation"
[6]: https://vite.dev/guide/ "Vite documentation"
[7]: https://react.dev/ "React documentation"
