# Requirements: Fase 0 — Scaffolding del monorepo

## Scope

Creare l'ossatura di backend e frontend in modo che partano, si testino e si parlino. Non c'è
ancora nessuna funzionalità di dominio.

### Incluso

| Area | Contenuto |
|---|---|
| Backend | Progetto uv in `backend/`, app FastAPI con `GET /api/health`, configurazione da env |
| Database | SQLAlchemy 2.x + Alembic configurati su SQLite, prima migrazione vuota (baseline) |
| Qualità backend | pytest, ruff (lint e format), mypy strict sul package `app` |
| Frontend | Progetto Vite + React + TypeScript in `frontend/`, Mantine come libreria UI |
| Layout base | `AppShell` con header (nome "AI Project Workbook"), area contenuto e footer |
| Home | Pagina iniziale che mostra lo stato del backend chiamando `/api/health` |
| Integrazione | Proxy di Vite da `/api` verso il backend; tipi TypeScript generati da OpenAPI |
| Qualità frontend | Vitest + Testing Library, oxlint, Prettier, `tsc -b` |
| Orchestrazione | `Makefile` alla radice: `install`, `dev`, `test`, `lint`, `format`, `gen-api` |
| Documentazione | README con prerequisiti e comandi |

### `GET /api/health`

```json
{ "status": "ok", "version": "0.1.0", "database": "ok" }
```

`database` vale `"ok"` se un `SELECT 1` sul DB riesce, altrimenti `"error"`; in quel caso la
risposta ha comunque HTTP 200, con `status: "degraded"`.

### Escluso

- Autenticazione, modelli di dominio, template del workbook (fasi successive)
- CI su GitHub Actions (rinviata: non c'è ancora un repository remoto)
- Docker e PostgreSQL in locale
- Servire la build del frontend dal backend (si farà nella fase di deploy)

## Decisions

- **Makefile alla radice** come unico punto d'ingresso; `make dev` avvia backend e frontend in
  parallelo (`make -j2`). Nessuna dipendenza Node aggiuntiva per l'orchestrazione.
- **Layout base subito**: l'`AppShell` di Mantine è il guscio in cui si innesteranno le pagine
  delle fasi successive.
- **Nome provvisorio "AI Project Workbook"**: neutro e già compatibile con la politica sui marchi.
  Si definisce in un solo punto del frontend, così è facile da cambiare.
- **Versione dell'app** letta da `pyproject.toml` tramite `importlib.metadata`, non duplicata.
- **Configurazione**: `pydantic-settings` con prefisso `APP_` (es. `APP_DATABASE_URL`), default
  `sqlite:///./dev.db`; un `.env.example` documenta le variabili.
- **Porte**: backend `8001` (la 8000 è già usata da un altro progetto), frontend `5173`.
- **Lingua**: interfaccia in italiano; per ora i testi stanno nei componenti, l'i18n non serve
  perché la lingua è una sola.

## Context

- Seguire la struttura di cartelle di `specs/tech-stack.md`. In questa fase si creano solo
  `main.py`, `config.py`, `db.py` e `routers/health.py`; le altre cartelle si aggiungono quando
  servono, non vuote.
- Toolchain disponibile: uv 0.9, Python 3.13 (gestito da uv), Node 24.
- La shell dell'utente stampa un avviso `nvm` a ogni comando: è innocuo, ma va ignorato
  nell'output degli script.
