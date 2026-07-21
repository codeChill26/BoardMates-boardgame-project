# AI + Python Environment Setup (Windows) — BG-Project

Ngày thực hiện: 2026-05-08

## 1) Kết quả kiểm tra hệ thống (audit)

- **Python**: đã có `Python 3.12.10` (qua `py` và `python`).
- **pip**: **không nằm trong PATH**, nhưng dùng được qua `python -m pip` / `py -m pip` (đây là cách mình dùng xuyên suốt).
- **Node.js**: `v24.13.0`
- **npm**: `11.6.2`
- **pnpm**: chưa có (không bắt buộc cho phần AI/Python).
- **Git**: `2.48.1.windows.1`
- **Ollama**: đã cài `0.23.1`.
  - Model local hiện có (tại thời điểm audit): `gemma4:e4b`.

> Gợi ý: nếu muốn cài `pnpm` để đồng bộ ecosystem Node, chạy: `npm i -g pnpm`.

---

## 2) Cấu trúc thư mục AI (professional, scalable)

Mình tạo thư mục `ai/` để tách hẳn AI service khỏi Next.js/Node, dễ scale & deploy độc lập:

- `ai/` — Python package gốc cho AI service.
- `ai/api/` — FastAPI app (HTTP APIs).
- `ai/scripts/` — scripts automation (setup/run/test).
- `ai/models/` — nơi lưu model files/caches (dành cho local inference/embeddings về sau).
- `ai/data/` — dữ liệu AI (vector DB, cache, knowledge base).
- `ai/venv/` — virtual environment **project-local** (đã ignore git).

---

## 3) Virtual environment (venv) + dependencies

### 3.1. Tạo venv và cài dependencies (automation)
Mình tạo sẵn script:

- Chạy setup:
  - `powershell -ExecutionPolicy Bypass -File ai/scripts/setup.ps1`

Script này sẽ:
- tạo `ai/venv`
- nâng pip trong venv
- cài packages từ `ai/requirements.txt`

### 3.2. Danh sách packages đã cài và ý nghĩa
Các thư viện trong `ai/requirements.txt`:

- `fastapi`: web framework cho Python AI service (HTTP API).
- `uvicorn[standard]`: ASGI server để chạy FastAPI.
- `python-dotenv`: load biến môi trường từ file `ai/.env`.
- `requests`: HTTP client (hữu ích khi call service khác).
- `numpy`, `pandas`: nền tảng xử lý dữ liệu, feature engineering, recommend.
- `ollama`: SDK Python để gọi local LLM trên Ollama.
- `openai`: SDK OpenAI (cloud fallback / hoặc endpoint tương thích).
- `sentence-transformers`: tạo embeddings (semantic search).
- `chromadb`: vector database local (persist) cho RAG/semantic search.
- `langchain`: nền tảng orchestrate LLM/RAG/tools/agents (mở rộng về sau).

> Production tip: hiện `requirements.txt` là “un-pinned” để cài dễ và nhanh. Khi deploy thật, lock lại bằng:
> - `ai/venv/Scripts/python.exe -m pip freeze > requirements.lock.txt`

---

## 4) Environment variables

Mình tạo file mẫu:

- `ai/.env.example`

Cách dùng:
1) Copy thành `ai/.env`
2) Chỉnh:
- `OLLAMA_HOST` (mặc định `http://localhost:11434`)
- `OLLAMA_MODEL` (model bạn đã pull, xem bằng `ollama list`)
- `EMBEDDING_MODEL` (mặc định `sentence-transformers/all-MiniLM-L6-v2`)
- `CHROMA_DIR`, `CHROMA_COLLECTION`

`ai/.env` đã được ignore trong `.gitignore` để tránh leak secrets.

---

## 5) FastAPI service (starter)

File chính:

- `ai/api/main.py`

Các endpoint nền tảng:

- `GET /health`: healthcheck + show current config.
- `POST /v1/chat`: chat qua Ollama (local LLM).
- `POST /v1/embeddings`: tạo embeddings bằng sentence-transformers.
- `POST /v1/rag/ingest`: ingest text → embeddings → lưu vào Chroma.
- `POST /v1/rag/query`: query semantic search trên Chroma.

### Chạy nhanh
Bạn có 2 cách “quick run” đúng như yêu cầu:

- Cách 1 (script):
  - `powershell -ExecutionPolicy Bypass -File ai/scripts/run_api.ps1`

- Cách 2 (python entrypoint):
  - `ai/venv/Scripts/python.exe ai/app.py`

---

## 6) Smoke tests (đã chuẩn bị sẵn)

### 6.1 Test Ollama
- Script: `ai/scripts/test_ollama.py`
- Chạy:
  - `ai/venv/Scripts/python.exe ai/scripts/test_ollama.py`

Ghi chú:
- Nếu `OLLAMA_MODEL` chưa tồn tại, script sẽ tự fallback sang model local đầu tiên (vd: `gemma4:e4b`).
- Nếu chưa pull model nào, chạy: `ollama pull <model>`.

### 6.2 Test embeddings + Chroma
- Script: `ai/scripts/test_embeddings.py`
- Chạy:
  - `ai/venv/Scripts/python.exe ai/scripts/test_embeddings.py`

Ghi chú:
- Lần đầu sẽ download embedding model từ HuggingFace.

---

## 7) Các file mình đã tạo và ý nghĩa

- `ai/requirements.txt`: danh sách dependencies cho AI service.
- `ai/.env.example`: template biến môi trường.
- `ai/__init__.py`: đánh dấu `ai` là Python package.
- `ai/api/__init__.py`: package cho API.
- `ai/api/main.py`: FastAPI app + chat/embeddings/RAG foundations.
- `ai/app.py`: entrypoint để chạy server bằng `python ai/app.py`.
- `ai/scripts/setup.ps1`: script tự động tạo venv + install dependencies.
- `ai/scripts/run_api.ps1`: script chạy FastAPI (dev mode).
- `ai/scripts/run_api.bat`: bản `.bat` để chạy nhanh (Windows CMD).
- `ai/scripts/test_ollama.py`: smoke test Ollama.
- `ai/scripts/test_embeddings.py`: smoke test embeddings + Chroma.
- `.gitignore`: đã thêm rules bỏ qua `ai/venv`, `ai/.env`, và các artifacts Python + local vector db.

---

## 8) Đề xuất kiến trúc tích hợp Next.js + Node/Express + Python AI (scalable)

Bạn đang có:
- `frontend/` (Next.js)
- `backend/` (Node/Express)
- `ai/` (Python/FastAPI) — mới thêm

### Khuyến nghị (đơn giản nhưng production-friendly)

- **Next.js (frontend)** chỉ gọi **Node/Express backend**.
- **Node/Express backend** đóng vai trò **BFF (Backend-for-Frontend)**:
  - chịu trách nhiệm auth/session/role
  - quản lý rate-limit, logging
  - gọi sang **Python AI service** qua HTTP nội bộ (`http://localhost:8001` khi local)
- **Python AI service** tập trung toàn bộ logic AI:
  - chat
  - embeddings
  - RAG
  - recommendation
  - agents/tools

Lý do:
- tránh expose trực tiếp AI service ra internet
- dễ scale: Python service scale riêng (workers) mà không ảnh hưởng Next/Node
- dễ thay LLM provider (Ollama/OpenAI/local inference)

### Gợi ý contract giữa Node ↔ Python
- Node gọi:
  - `POST /v1/chat`
  - `POST /v1/embeddings`
  - `POST /v1/rag/query`
- Truyền `user_id`, `locale`, `game_context` qua metadata để cá nhân hóa boardgame assistant.

---

## 9) Foundation roadmap (đã chuẩn bị nền)

Những thứ đã “mở đường” để làm tiếp:

- **Chatbot AI**: endpoint `/v1/chat` + Ollama local.
- **Embeddings + semantic search**: `/v1/embeddings` + Chroma persist.
- **RAG**: ingest/query đã có sườn; bước tiếp theo là loaders + chunking + metadata.
- **Recommendation system**: `pandas/numpy` sẵn; có thể kết hợp:
  - content-based (embeddings theo mô tả game)
  - collaborative filtering (từ order/listing behavior)
- **AI agents/automation**: `langchain` đã sẵn để orchestrate tools (DB queries, search, actions).

---

## 10) Troubleshooting nhanh

- `pip` không nằm trong PATH:
  - dùng `py -m pip ...` hoặc `ai/venv/Scripts/python.exe -m pip ...`

- Ollama báo `model not found`:
  - `ollama list`
  - `ollama pull <model>`
  - set `OLLAMA_MODEL` trong `ai/.env`

- HuggingFace download chậm / rate limit:
  - set `HF_TOKEN` trong environment để tăng rate limit.

---

## Quick commands (cheat sheet)

- Setup venv + deps:
  - `powershell -ExecutionPolicy Bypass -File ai/scripts/setup.ps1`

- Run API:
  - `powershell -ExecutionPolicy Bypass -File ai/scripts/run_api.ps1`

- Run via python (entrypoint):
  - `ai/venv/Scripts/python.exe ai/app.py`

- Test Ollama:
  - `ai/venv/Scripts/python.exe ai/scripts/test_ollama.py`

- Test embeddings + Chroma:
  - `ai/venv/Scripts/python.exe ai/scripts/test_embeddings.py`
