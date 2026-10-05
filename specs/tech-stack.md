# Tech Stack

Monorepo con due applicazioni: `backend/` (API Python) e `frontend/` (SPA React).
In produzione il backend serve anche i file statici del frontend, così c'è una sola origine: niente
CORS, e cookie di sessione `SameSite=Lax`.

## Backend — `backend/`

- **Python 3.13**, dipendenze e virtualenv gestiti con **uv** (`pyproject.toml`, `uv.lock`)
- **FastAPI**: API REST JSON sotto `/api`, documentazione OpenAPI generata automaticamente
- **Pydantic v2** (con `pydantic-settings`): schemi di richiesta/risposta e configurazione da env
- **SQLAlchemy 2.x** (stile tipizzato `Mapped[...]`) e **Alembic** per le migrazioni
- Database:
  - sviluppo e test: **SQLite** (Docker e PostgreSQL non sono installati sulla macchina di sviluppo)
  - produzione: **PostgreSQL**
  - quindi niente funzioni specifiche di un solo database; `JSON` generico, nessun `JSONB`
    esplicito
- **Autenticazione**: realizzata in proprio, semplice e verificabile
  - password con hash **Argon2** (`pwdlib[argon2]`)
  - sessioni lato server salvate in DB; il browser riceve solo un id opaco in un cookie
    `HttpOnly`, `Secure` (in produzione), `SameSite=Lax`
  - protezione CSRF sulle richieste che modificano dati (double-submit token in un header)
  - niente JWT nel `localStorage`
- **Generazione documenti**: `python-docx` per il DOCX. Il PDF si sceglierà nella fase dedicata
  (WeasyPrint oppure conversione da DOCX), valutando le dipendenze di sistema.
- **AI**: astrazione `LLMProvider` (Protocol) in `backend/app/ai/`
  - primo adapter: **Anthropic**, con l'SDK ufficiale `anthropic`
  - modello di default `claude-opus-5-5`, configurabile da env (`AI_MODEL`)
  - risposte in streaming verso il frontend (Server-Sent Events)
  - fallback lato server in caso di rifiuto attivato di default (parametro `fallbacks`)
  - altri provider (OpenAI, modelli locali) si aggiungono implementando lo stesso Protocol, senza
    toccare il resto del codice
  - le chiavi API stanno solo sul server; quote d'uso per utente registrate in DB
- **Test**: **pytest**, con `httpx` / `TestClient` di FastAPI; DB SQLite in memoria per ogni test
- **Qualità**: **ruff** (lint e format), **mypy** in modalità strict sul package `app`

Struttura prevista:

```
backend/
  app/
    main.py            # crea l'app FastAPI, monta i router
    config.py          # Settings (pydantic-settings)
    db.py              # engine, session, Base
    models/            # modelli SQLAlchemy
    schemas/           # schemi Pydantic
    routers/           # un router per area (auth, projects, iterations, answers, share, ai, export)
    services/          # logica di dominio, nessuna dipendenza da FastAPI
    workbook/          # definizione strutturata del workbook (YAML) + loader/validatore
    ai/                # LLMProvider, adapter, prompt
    export/            # generazione documenti
  migrations/          # Alembic
  tests/
```

## Frontend — `frontend/`

- **React 19 + TypeScript** (strict), build con **Vite**
- **React Router** per la navigazione
- **TanStack Query** per le chiamate API, la cache e il salvataggio automatico ottimistico
- **Tipi API generati** dallo schema OpenAPI del backend (`openapi-typescript`): il contratto API
  non si duplica a mano
- **UI**: **Mantine**, una libreria di componenti completa (form, modali, stepper, notifiche) con
  supporto i18n, così non si costruisce un design system da zero
- **Editor dei campi**: per ora textarea con autosize; un editor ricco (Markdown) si valuterà in
  una fase successiva
- **Test**: **Vitest** e **Testing Library**; **Playwright** per i test end-to-end a partire dalla
  fase di compilazione
- **Qualità**: ESLint e Prettier; `tsc --noEmit` come controllo dei tipi

## Comandi (da definire nella Fase 0)

| Scopo | Comando |
|---|---|
| Avvio backend in sviluppo | `cd backend && uv run fastapi dev app/main.py` |
| Test backend | `cd backend && uv run pytest` |
| Lint e tipi backend | `cd backend && uv run ruff check . && uv run mypy app` |
| Avvio frontend in sviluppo | `cd frontend && npm run dev` (proxy `/api` verso il backend) |
| Test frontend | `cd frontend && npm test` |
| Tipi frontend | `cd frontend && npm run typecheck` |
| Rigenera i tipi API | `cd frontend && npm run gen:api` |

## Deploy (da decidere nella fase di rilascio pubblico)

Un container (backend che serve anche la build del frontend) più un PostgreSQL gestito. Candidati:
Fly.io, Render, Railway, oppure una VPS europea (preferibile per il GDPR).

## Lacune note

- Senza Docker in locale, i test su PostgreSQL arriveranno con la CI (GitHub Actions con un
  servizio postgres).
- Email transazionali (verifica account, reset password): fornitore da scegliere nella fase di
  rilascio pubblico.
