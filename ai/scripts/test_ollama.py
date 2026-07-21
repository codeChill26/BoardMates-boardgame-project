"""Smoke test for Ollama.

What it checks:
- Ollama server reachable
- Can chat with the configured model

Usage:
  ai/venv/Scripts/python.exe ai/scripts/test_ollama.py

Tips:
- If you get model-not-found: run `ollama pull <model>` first.
- If Ollama is not running: open the Ollama app or run `ollama serve`.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv

# Load ai/.env if present
load_dotenv("ai/.env")


def main() -> None:
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")
    num_predict = int(os.getenv("OLLAMA_NUM_PREDICT", "128"))
    num_ctx = int(os.getenv("OLLAMA_NUM_CTX", "2048"))
    temperature = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))

    print(f"OLLAMA_HOST={ollama_host}")
    print(f"OLLAMA_MODEL={ollama_model}")
    print(f"OLLAMA_NUM_PREDICT={num_predict}")
    print(f"OLLAMA_NUM_CTX={num_ctx}")
    print(f"OLLAMA_TEMPERATURE={temperature}")

    try:
        import ollama

        # The `ollama` package reads OLLAMA_HOST from env.
        os.environ["OLLAMA_HOST"] = ollama_host

        def do_chat(model: str):
            return ollama.chat(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful boardgame assistant."},
                    {"role": "user", "content": "Say hello in Vietnamese and suggest 1 boardgame."},
                ],
                options={
                    "num_predict": num_predict,
                    "num_ctx": num_ctx,
                    "temperature": temperature,
                },
            )

        try:
            resp = do_chat(ollama_model)
            used_model = ollama_model
        except Exception as exc:  # noqa: BLE001
            # Common first-run issue: model is not pulled locally.
            if "not found" in str(exc).lower():
                models = ollama.list().get("models", [])
                if not models:
                    raise
                fallback = models[0].get("name") or models[0].get("model")
                if not fallback:
                    raise
                print(f"Configured model not found. Falling back to local model: {fallback}")
                resp = do_chat(fallback)
                used_model = fallback
            else:
                raise

        print("--- Reply ---")
        print(resp.get("message", {}).get("content", ""))
        print(f"\nOK: Ollama chat succeeded (model={used_model})")
    except Exception:  # noqa: BLE001
        print("FAILED: Ollama chat failed")
        raise


if __name__ == "__main__":
    main()
