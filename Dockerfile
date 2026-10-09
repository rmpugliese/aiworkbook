# The whole app in one image: the backend serves the API, the shared pages and the frontend build.

# --- Frontend build ----------------------------------------------------------------------------
FROM node:24-bookworm-slim AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- Runtime -----------------------------------------------------------------------------------
FROM python:3.13-slim-bookworm AS runtime

# Pango and fonts for WeasyPrint (PDF generation).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libharfbuzz-subset0 \
        fonts-liberation fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.9.16 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1

WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/ ./
RUN uv sync --frozen --no-dev
COPY --from=frontend /src/frontend/dist /app/frontend-dist

RUN useradd --system --uid 10001 --no-create-home app
USER app

ENV APP_ENV=production APP_FRONTEND_DIST=/app/frontend-dist
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=4)"

# Migrations first, then the server. Behind the proxy: trust its X-Forwarded-* headers (the app
# port is not published, only Caddy reaches it). No access log: our own request log masks the
# tokens of shared links, Uvicorn's would not.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*' --no-access-log"]
