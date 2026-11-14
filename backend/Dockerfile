# Multi-stage Dockerfile for ShieldPay Backend
# Target 1 (default): core - Rust Payments Core & Reliability Engine
# Target 2: python - Python Risk, AI & Simulator Service

# ----------------- Target: core (Rust) -----------------
FROM rust:1-slim-bookworm AS core-builder

WORKDIR /usr/src/shieldpay

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml* Cargo.lock* ./
COPY backend/Cargo.toml* ./
COPY app ./app

# Build standalone or workspace package
RUN cargo build --release || cargo build --release --manifest-path Cargo.toml

FROM debian:bookworm-slim AS core

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=core-builder /usr/src/shieldpay/target/release/shieldpay-core /usr/local/bin/shieldpay-core

EXPOSE 8080

ENV PORT=8080 \
    DATABASE_URL=/data/shieldpay.db \
    HMAC_SECRET=dev-secret-key \
    COOLING_SECONDS=20 \
    RISK_ENGINE_URL=http://risk-ai:8000

VOLUME ["/data"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["shieldpay-core"]

# ----------------- Target: python -----------------
FROM python:3.11-slim AS python

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY app/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
