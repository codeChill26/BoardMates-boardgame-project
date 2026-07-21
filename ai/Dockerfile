# AI service image
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        git \
        libgomp1 \
        sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install deps first for better layer caching
COPY ai/requirements.txt ./ai/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r ai/requirements.txt

# Copy only the AI service code
COPY ai/ ./ai/

EXPOSE 8001

CMD ["uvicorn", "ai.api.main:app", "--host", "0.0.0.0", "--port", "8001"]
