# Plan: Fase 0 — Scaffolding del monorepo

## Gruppo 1: Backend di base

1. `uv init` in `backend/` (Python 3.13, package `app`, versione `0.1.0`)
2. Dipendenze: `fastapi[standard]`, `sqlalchemy`, `alembic`, `pydantic-settings`; sviluppo:
   `pytest`, `ruff`, `mypy`
3. `app/config.py`: `Settings` con `database_url`, `env` (`development` | `production` | `test`)
4. `app/db.py`: engine, `SessionLocal`, `Base` (DeclarativeBase), dipendenza `get_db`
5. `app/routers/health.py`: `GET /api/health` come da requirements
6. `app/main.py`: `create_app()` che monta i router; titolo OpenAPI "AI Project Workbook API"
7. Configurazione di ruff e mypy in `pyproject.toml`

## Gruppo 2: Migrazioni

8. `alembic init migrations`; `env.py` legge l'URL da `Settings` e i metadati da `Base`
9. Migrazione baseline vuota

## Gruppo 3: Test backend

10. `tests/conftest.py`: fixture `client` con DB SQLite in memoria
11. `tests/test_health.py`: risposta 200, `status: "ok"`, `database: "ok"`, versione presente;
    caso `degraded` con DB irraggiungibile

## Gruppo 4: Frontend di base

12. Vite con il template `react-ts` in `frontend/`
13. Mantine (`@mantine/core`, `@mantine/hooks`), React Router, TanStack Query
14. `src/config.ts` con `APP_NAME = "AI Project Workbook"`
15. `src/components/Layout.tsx`: `AppShell` con header (nome dell'app) e footer
    ("Compatibile con la metodologia CPMAI")
16. `src/pages/Home.tsx`: titolo, breve descrizione, badge con lo stato del backend
17. `src/api/client.ts`: wrapper `fetch` tipizzato; `npm run gen:api` genera `src/api/schema.ts`
    con `openapi-typescript` partendo dallo schema del backend
18. Proxy di Vite: `/api` verso `http://127.0.0.1:8001`

## Gruppo 5: Qualità frontend

19. oxlint (config del template Vite) e Prettier; script `lint`, `format`, `typecheck`
20. Vitest con jsdom e Testing Library; `src/test/setup.ts` con il polyfill di `matchMedia` per
    Mantine
21. Test: `Layout` mostra il nome dell'app; `Home` mostra lo stato "online" con un fetch simulato
    e "non raggiungibile" in caso di errore

## Gruppo 6: Orchestrazione e documentazione

22. `Makefile` con i target `install`, `dev`, `dev-backend`, `dev-frontend`, `test`, `lint`,
    `format`, `gen-api`, `migrate`
23. `.env.example` nel backend
24. README: prerequisiti, `make install`, `make dev`, gli altri comandi
25. Aggiornare la tabella dei comandi in `specs/tech-stack.md`
