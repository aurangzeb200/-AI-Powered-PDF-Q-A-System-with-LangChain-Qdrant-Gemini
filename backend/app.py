"""API service for the PDF Q&A application.

The service keeps document metadata in a small JSON registry and stores chunk
embeddings in a local Qdrant database. Embeddings and Gemini are initialized
lazily so the health endpoint stays useful before the first upload.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).parent / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
REGISTRY_PATH = DATA_DIR / "documents.json"
QDRANT_PATH = DATA_DIR / "qdrant"
MAX_FILE_BYTES = int(os.getenv("MAX_FILE_BYTES", 10 * 1024 * 1024))
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

try:
    from pypdf import PdfReader
    from qdrant_client import QdrantClient, models
except ImportError as exc:  # pragma: no cover - surfaced through /health
    PdfReader = None  # type: ignore[assignment]
    QdrantClient = None  # type: ignore[assignment]
    models = None  # type: ignore[assignment]
    IMPORT_ERROR = str(exc)
else:
    IMPORT_ERROR = ""

app = FastAPI(title="Papertrail PDF Q&A API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    document_id: str | None = None


class Source(BaseModel):
    id: str
    title: str
    page: int | None = None
    confidence: float = Field(ge=0, le=1)


class ChatResponse(BaseModel):
    text: str
    sources: list[Source]


class Document(BaseModel):
    id: str
    name: str
    size: int
    pages: int
    chunks: int
    status: str
    created_at: str


class DocumentRegistry:
    def __init__(self) -> None:
        self.items: dict[str, Document] = {}
        if REGISTRY_PATH.exists():
            try:
                raw = json.loads(REGISTRY_PATH.read_text())
                self.items = {item["id"]: Document.model_validate(item) for item in raw}
            except (OSError, ValueError, TypeError):
                self.items = {}

    def save(self) -> None:
        REGISTRY_PATH.write_text(json.dumps([item.model_dump() for item in self.items.values()], indent=2))


registry = DocumentRegistry()
qdrant: Any = None
embedder: Any = None
gemini: Any = None


def get_qdrant() -> Any:
    global qdrant
    if qdrant is None:
        if QdrantClient is None or models is None:
            raise RuntimeError(f"Backend dependencies are unavailable: {IMPORT_ERROR}")
        qdrant = QdrantClient(path=str(QDRANT_PATH))
        if not qdrant.collection_exists("pdf_chunks"):
            qdrant.create_collection(
                collection_name="pdf_chunks",
                vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE),
            )
    return qdrant


def get_embedder() -> Any:
    global embedder
    if embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise RuntimeError(f"Embedding dependency is unavailable: {exc}") from exc
        embedder = SentenceTransformer(EMBEDDING_MODEL)
    return embedder


def get_gemini() -> Any:
    global gemini
    if gemini is None:
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY is not configured")
        try:
            from google import genai
        except ImportError as exc:
            raise RuntimeError(f"Gemini dependency is unavailable: {exc}") from exc
        gemini = genai.Client(api_key=api_key)
    return gemini


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 180) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(normalized):
        end = min(start + chunk_size, len(normalized))
        if end < len(normalized):
            boundary = normalized.rfind(" ", start, end)
            if boundary > start + chunk_size // 2:
                end = boundary
        chunks.append(normalized[start:end].strip())
        if end >= len(normalized):
            break
        start = max(end - overlap, start + 1)
    return chunks


def document_filter(document_id: str) -> Any:
    return models.Filter(must=[models.FieldCondition(key="document_id", match=models.MatchValue(value=document_id))])


@app.get("/health")
def health() -> dict[str, Any]:
    dependencies_ready = PdfReader is not None and QdrantClient is not None
    gemini_configured = bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "service": "papertrail-api",
        "ready": dependencies_ready and gemini_configured,
        "gemini_configured": gemini_configured,
        "documents": len(registry.items),
    }


@app.get("/documents", response_model=list[Document])
def list_documents() -> list[Document]:
    return sorted(registry.items.values(), key=lambda item: item.created_at, reverse=True)


@app.post("/upload", response_model=Document, status_code=201)
async def upload_document(file: UploadFile = File(...)) -> Document:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds the 10 MB upload limit.")
    if PdfReader is None:
        raise HTTPException(status_code=503, detail=f"PDF dependencies are unavailable: {IMPORT_ERROR}")

    document_id = uuid.uuid4().hex[:12]
    pdf_path = DATA_DIR / f"{document_id}.pdf"
    pdf_path.write_bytes(content)
    try:
        reader = PdfReader(str(pdf_path))
        chunks_with_pages: list[dict[str, Any]] = []
        for page_number, page in enumerate(reader.pages, start=1):
            for chunk in chunk_text(page.extract_text() or ""):
                chunks_with_pages.append({"text": chunk, "page": page_number})
        if not chunks_with_pages:
            raise HTTPException(status_code=422, detail="The PDF does not contain extractable text.")

        vectors = get_embedder().encode([item["text"] for item in chunks_with_pages], normalize_embeddings=True).tolist()
        points = [
            models.PointStruct(
                id=uuid.uuid4().hex,
                vector=vector,
                payload={
                    "document_id": document_id,
                    "text": item["text"],
                    "page": item["page"],
                    "source": file.filename,
                },
            )
            for vector, item in zip(vectors, chunks_with_pages)
        ]
        get_qdrant().upsert(collection_name="pdf_chunks", points=points)
        document = Document(
            id=document_id,
            name=file.filename,
            size=len(content),
            pages=len(reader.pages),
            chunks=len(points),
            status="indexed",
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        registry.items[document_id] = document
        registry.save()
        return document
    except HTTPException:
        pdf_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        pdf_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Could not index PDF: {exc}") from exc


@app.delete("/documents/{document_id}", status_code=204, response_model=None)
def delete_document(document_id: str) -> Response:
    if document_id not in registry.items:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        get_qdrant().delete(collection_name="pdf_chunks", points_selector=models.FilterSelector(filter=document_filter(document_id)))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not remove document vectors: {exc}") from exc
    registry.items.pop(document_id, None)
    registry.save()
    (DATA_DIR / f"{document_id}.pdf").unlink(missing_ok=True)
    return Response(status_code=204)


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    if not registry.items:
        raise HTTPException(status_code=400, detail="Upload a PDF before asking a question.")
    if request.document_id and request.document_id not in registry.items:
        raise HTTPException(status_code=404, detail="Selected document not found.")

    try:
        query_vector = get_embedder().encode(request.query, normalize_embeddings=True).tolist()
        results = get_qdrant().query_points(
            collection_name="pdf_chunks",
            query=query_vector,
            query_filter=document_filter(request.document_id) if request.document_id else None,
            limit=5,
            with_payload=True,
        ).points
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}") from exc

    sources = [
        Source(
            id=str(point.id),
            title=str(point.payload.get("source", "PDF document")),
            page=int(point.payload["page"]) if point.payload.get("page") else None,
            confidence=round(max(0.0, min(1.0, float(point.score))), 3),
        )
        for point in results
    ]
    context = "\n\n".join(str(point.payload.get("text", "")) for point in results)
    if not context:
        return ChatResponse(text="I could not find relevant text in the indexed documents.", sources=[])

    try:
        answer = get_gemini().models.generate_content(
            model=GEMINI_MODEL,
            contents=(
                "Answer the question using only the supplied document context. "
                "If the context is insufficient, say so clearly. Be concise and cite page numbers in the prose when useful.\n\n"
                f"Context:\n{context}\n\nQuestion: {request.query}"
            ),
        )
        text = (answer.text or "").strip()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc
    return ChatResponse(text=text or "Gemini returned an empty answer.", sources=sources)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
