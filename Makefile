.PHONY: install dev dev-backend dev-frontend test lint format gen-api migrate

BACKEND := cd backend &&
FRONTEND := cd frontend &&

install:
	$(BACKEND) uv sync
	$(FRONTEND) npm install

# Runs backend (http://127.0.0.1:8001) and frontend (http://localhost:5173) in parallel.
dev:
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	$(BACKEND) uv run fastapi dev app/main.py --port 8001

dev-frontend:
	$(FRONTEND) npm run dev

test:
	$(BACKEND) uv run pytest
	$(FRONTEND) npm test

lint:
	$(BACKEND) uv run ruff check . && uv run ruff format --check . && uv run mypy app tests
	$(FRONTEND) npm run lint && npm run typecheck && npm run format:check

format:
	$(BACKEND) uv run ruff check --fix . && uv run ruff format .
	$(FRONTEND) npm run format

# Regenerates frontend/src/api/schema.ts from the backend's OpenAPI schema (no server needed).
gen-api:
	$(BACKEND) uv run python -c "import json; from app.main import app; print(json.dumps(app.openapi()))" > ../frontend/openapi.json
	$(FRONTEND) npm run gen:api

migrate:
	$(BACKEND) uv run alembic upgrade head
