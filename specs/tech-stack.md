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

- **React 19 + TypeScript 5.9** (strict), build con **Vite**. TypeScript resta alla 5.x finché
  `openapi-typescript` non supporta la 6
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
- **Qualità**: **oxlint** (il linter predefinito del template Vite), Prettier e `tsc -b` come
  controllo dei tipi

## Comandi

Tutto passa dal `Makefile` alla radice. Su questo Mac si usa `gmake` (GNU make di MacPorts),
perché il `make` di sistema richiede di accettare la licenza di Xcode.

| Scopo | Comando |
|---|---|
| Installa le dipendenze | `make install` |
| Avvia backend (http://127.0.0.1:8001) e frontend (http://localhost:5173) | `make dev` |
| Test (pytest + Vitest) | `make test` |
| Lint, format check e tipi | `make lint` |
| Formatta il codice | `make format` |
| Rigenera i tipi API del frontend | `make gen-api` |
| Applica le migrazioni | `make migrate` |

Il backend usa la porta **8001** perché la 8000 è occupata da un altro progetto locale.

## Deploy (da decidere nella fase di rilascio pubblico)

Un container (backend che serve anche la build del frontend) più un PostgreSQL gestito. Candidati:
Fly.io, Render, Railway, oppure una VPS europea (preferibile per il GDPR).

## Lacune note

- Senza Docker in locale, i test su PostgreSQL arriveranno con la CI (GitHub Actions con un
  servizio postgres).
- Email transazionali (verifica account, reset password): fornitore da scegliere nella fase di
  rilascio pubblico.
