"""FastAPI AI Service (foundation).

Goals:
- Provide clean HTTP APIs for: healthcheck, chat (Ollama), embeddings, and basic RAG.
- Keep state minimal and explicit (env-driven config).
- Be easy to extend later (agents, tools, recommendation, etc.).

Run (dev):
  ai/scripts/run_api.ps1
Or manually:
  ai/venv/Scripts/python.exe -m uvicorn ai.api.main:app --reload --port 8001
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, List, Optional

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# Load environment variables from ai/.env if present.
# We keep it scoped to the ai folder so it doesn't conflict with Node env files.
_AI_DIR = Path(__file__).resolve().parents[1]
load_dotenv(_AI_DIR / ".env")


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name)
    return value if value is not None and value != "" else default


OLLAMA_HOST = _env("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = _env("OLLAMA_MODEL", "llama3.1")
OLLAMA_NUM_PREDICT = int(_env("OLLAMA_NUM_PREDICT", "256"))
OLLAMA_NUM_CTX = int(_env("OLLAMA_NUM_CTX", "2048"))
OLLAMA_TEMPERATURE = float(_env("OLLAMA_TEMPERATURE", "0.2"))
EMBEDDING_MODEL = _env("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
CHROMA_DIR = _env("CHROMA_DIR", "ai/data/chroma")
CHROMA_COLLECTION = _env("CHROMA_COLLECTION", "boardgame_knowledge")


app = FastAPI(
    title="BG-Project AI Service",
    version="0.1.0",
    description="Python AI microservice for chat, embeddings, and RAG.",
)


# ----------------------------
# Schemas
# ----------------------------


class HealthResponse(BaseModel):
    status: str
    ollama_host: str
    ollama_model: str
    embedding_model: str
    chroma_dir: str
    chroma_collection: str


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    system: Optional[str] = Field(None, description="Optional system prompt")


class ChatResponse(BaseModel):
    model: str
    reply: str


class EmbeddingsRequest(BaseModel):
    texts: List[str]


class EmbeddingsResponse(BaseModel):
    model: str
    embeddings: List[List[float]]


class RagIngestRequest(BaseModel):
    texts: List[str]
    metadatas: Optional[List[dict[str, Any]]] = None


class RagIngestResponse(BaseModel):
    collection: str
    count: int


class RagQueryRequest(BaseModel):
    query: str
    top_k: int = 5


class RagQueryResponse(BaseModel):
    collection: str
    top_k: int
    results: List[dict[str, Any]]


# ----------------------------
# Lazy singletons (in-process)
# ----------------------------

_sentence_transformer = None
_chroma_collection = None


def _get_sentence_transformer():
    """Load SentenceTransformer lazily.

    Notes:
    - First run will download the model if not cached.
    - For production, you can pre-download and mount/cache `HF_HOME`.
    """

    global _sentence_transformer
    if _sentence_transformer is None:
        try:
            from sentence_transformers import SentenceTransformer

            _sentence_transformer = SentenceTransformer(EMBEDDING_MODEL)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to load sentence-transformers model. "
                    "If this is the first run, ensure you have internet to download the model, "
                    "or configure a local cache."  # keep error user-friendly
                ),
            ) from exc
    return _sentence_transformer


def _embed_texts(texts: List[str]) -> List[List[float]]:
    model = _get_sentence_transformer()
    vectors = model.encode(texts, normalize_embeddings=True)
    if isinstance(vectors, list):
        vectors = np.asarray(vectors)
    return vectors.astype(float).tolist()


def _get_chroma_collection():
    """Get (or create) the persistent ChromaDB collection."""

    global _chroma_collection
    if _chroma_collection is None:
        try:
            import chromadb

            client = chromadb.PersistentClient(path=CHROMA_DIR)
            _chroma_collection = client.get_or_create_collection(name=CHROMA_COLLECTION)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=500, detail="Failed to init ChromaDB") from exc
    return _chroma_collection


# ----------------------------
# Routes
# ----------------------------


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        ollama_host=OLLAMA_HOST,
        ollama_model=OLLAMA_MODEL,
        embedding_model=EMBEDDING_MODEL,
        chroma_dir=CHROMA_DIR,
        chroma_collection=CHROMA_COLLECTION,
    )


@app.post("/v1/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """Chat using local Ollama model.

    Requirements:
    - Ollama installed and running.
    - The model pulled locally: `ollama pull <model>`.
    """

    try:
        import ollama

        # Configure host if custom.
        if OLLAMA_HOST:
            os.environ["OLLAMA_HOST"] = OLLAMA_HOST
            ollama.Client(host=OLLAMA_HOST)  # validates host format

        messages = []
        if req.system:
            messages.append({"role": "system", "content": req.system})
        messages.append({"role": "user", "content": req.message})

        model_to_use = OLLAMA_MODEL
        try:
            resp = ollama.chat(
                model=model_to_use,
                messages=messages,
                options={
                    "num_predict": OLLAMA_NUM_PREDICT,
                    "num_ctx": OLLAMA_NUM_CTX,
                    "temperature": OLLAMA_TEMPERATURE,
                },
            )
        except Exception as inner_exc:  # noqa: BLE001
            # First-run friendliness: if the configured model isn't pulled locally,
            # fall back to the first available local model.
            if "not found" in str(inner_exc).lower():
                models = ollama.list().get("models", [])
                if models:
                    fallback = models[0].get("name") or models[0].get("model")
                    if fallback:
                        model_to_use = fallback
                        resp = ollama.chat(
                            model=model_to_use,
                            messages=messages,
                            options={
                                "num_predict": OLLAMA_NUM_PREDICT,
                                "num_ctx": OLLAMA_NUM_CTX,
                                "temperature": OLLAMA_TEMPERATURE,
                            },
                        )
                    else:
                        raise
                else:
                    raise
            else:
                raise

        reply = resp.get("message", {}).get("content", "")
        return ChatResponse(model=model_to_use, reply=reply)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=(
                "Ollama chat failed. Ensure Ollama is running and the model exists locally. "
                "Try: `ollama pull <model>`"
            ),
        ) from exc


@app.post("/v1/embeddings", response_model=EmbeddingsResponse)
def embeddings(req: EmbeddingsRequest) -> EmbeddingsResponse:
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts must be non-empty")

    vectors = _embed_texts(req.texts)
    return EmbeddingsResponse(model=EMBEDDING_MODEL, embeddings=vectors)


@app.post("/v1/rag/ingest", response_model=RagIngestResponse)
def rag_ingest(req: RagIngestRequest) -> RagIngestResponse:
    """Ingest texts into ChromaDB with sentence-transformers embeddings.

    This is a simple foundation; later you can:
    - add document loaders (PDF/HTML), chunking, deduping
    - store rich metadata (game id, category, language)
    - switch embedding provider (Ollama/OpenAI)
    """

    if not req.texts:
        raise HTTPException(status_code=400, detail="texts must be non-empty")

    collection = _get_chroma_collection()
    metadatas = req.metadatas or [{} for _ in req.texts]
    if len(metadatas) != len(req.texts):
        raise HTTPException(status_code=400, detail="metadatas length must match texts")

    ids = [f"doc_{i}" for i in range(len(req.texts))]
    vectors = _embed_texts(req.texts)

    try:
        collection.add(ids=ids, documents=req.texts, metadatas=metadatas, embeddings=vectors)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Failed to add documents to Chroma") from exc

    return RagIngestResponse(collection=CHROMA_COLLECTION, count=len(req.texts))


@app.post("/v1/rag/query", response_model=RagQueryResponse)
def rag_query(req: RagQueryRequest) -> RagQueryResponse:
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query must be non-empty")

    collection = _get_chroma_collection()
    query_vec = _embed_texts([req.query])[0]

    try:
        results = collection.query(
            query_embeddings=[query_vec],
            n_results=req.top_k,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="Chroma query failed") from exc

    # Chroma returns batched results.
    out: List[dict[str, Any]] = []
    ids = (results.get("ids") or [[]])[0]
    docs = (results.get("documents") or [[]])[0]
    metas = (results.get("metadatas") or [[]])[0]
    dists = (results.get("distances") or [[]])[0]

    for i in range(min(len(ids), len(docs), len(metas), len(dists))):
        out.append({"id": ids[i], "document": docs[i], "metadata": metas[i], "distance": dists[i]})

    return RagQueryResponse(collection=CHROMA_COLLECTION, top_k=req.top_k, results=out)
