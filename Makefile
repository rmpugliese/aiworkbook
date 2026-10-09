.PHONY: install dev dev-backend dev-frontend test test-postgres e2e lint format gen-api migrate build

# WeasyPrint loads Pango at runtime. On Apple Silicon it comes from Homebrew in /opt/homebrew
# (an Intel install in /usr/local or MacPorts has the wrong architecture). macOS strips DYLD_*
# variables from the environment of /bin/sh, so the variable is set on the command itself.
ifeq ($(shell uname -s),Darwin)
PANGO := DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib
endif

BACKEND := cd backend && $(PANGO)
FRONTEND := cd frontend &&

install:
	$(BACKEND) uv sync
	$(FRONTEND) npm install && npx playwright install chromium

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

# The backend tests on PostgreSQL. Needs a running server and an empty database, e.g.
# createdb cpmai_test; override with PG_TEST_URL=postgresql+psycopg://user:pass@host/db.
PG_TEST_URL ?= postgresql+psycopg://localhost/cpmai_test
test-postgres:
	$(BACKEND) APP_TEST_DATABASE_URL=$(PG_TEST_URL) uv run pytest

# End-to-end tests on their own servers and throwaway database (see frontend/playwright.config.ts).
e2e:
	$(FRONTEND) npm run e2e

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

# The production image (needs Docker): see DEPLOY.md.
build:
	docker build -t ai-project-workbook:latest .
