"""Smoke test for embeddings + optional Chroma vector search.

Usage:
  ai/venv/Scripts/python.exe ai/scripts/test_embeddings.py

Notes:
- First run may download the embedding model (internet required).
- For production, pre-download the model and configure cache directories.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv("ai/.env")


def main() -> None:
    model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    chroma_dir = os.getenv("CHROMA_DIR", "ai/data/chroma")
    collection_name = os.getenv("CHROMA_COLLECTION", "boardgame_knowledge")

    print(f"EMBEDDING_MODEL={model_name}")
    print(f"CHROMA_DIR={chroma_dir}")
    print(f"CHROMA_COLLECTION={collection_name}")

    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(model_name)

    texts = [
        "Catan is a classic trading and settlement game.",
        "Azul is an abstract tile-laying game with beautiful components.",
        "Terraforming Mars is a strategy engine-builder about space projects.",
    ]
    vecs = model.encode(texts, normalize_embeddings=True)

    print(f"Embedded {len(texts)} texts")
    try:
        print(f"Vector shape: {vecs.shape}")
    except Exception:
        pass

    # Optional: store and query in ChromaDB
    import chromadb

    client = chromadb.PersistentClient(path=chroma_dir)
    col = client.get_or_create_collection(name=collection_name)

    ids = ["catan", "azul", "tmars"]
    col.upsert(ids=ids, documents=texts, embeddings=vecs.tolist())

    q = "I like building engines and deep strategy"
    qv = model.encode([q], normalize_embeddings=True)[0]
    res = col.query(query_embeddings=[qv.tolist()], n_results=2, include=["documents", "distances"]) 

    print("--- Query ---")
    print(q)
    print("--- Top results ---")
    for idx, doc, dist in zip(res["ids"][0], res["documents"][0], res["distances"][0]):
        print(f"- {idx} (distance={dist:.4f}): {doc}")

    print("\nOK: embeddings + chroma query succeeded")


if __name__ == "__main__":
    main()
