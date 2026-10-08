# AI Project Workbook

Applicazione web per compilare il workbook della metodologia CPMAI progetto per progetto e
iterazione per iterazione. Salva le risposte in un database, genera il documento finale,
permette di condividerlo in sola lettura con il cliente e offre un assistente AI su richiesta.

"AI Project Workbook" è il nome provvisorio; quello definitivo si sceglie prima del rilascio
pubblico.

## Prerequisiti

- [uv](https://docs.astral.sh/uv/), che installa anche Python 3.13
- Node.js 24 e npm
- Pango, la libreria di sistema usata da WeasyPrint per generare i PDF:
  - macOS Apple Silicon: `brew install pango` con Homebrew arm64 (in `/opt/homebrew`); il
    `Makefile` la trova da solo
  - Linux: `apt install libpango-1.0-0 libpangoft2-1.0-0` (o equivalente)
- GNU make. Su macOS il `make` di sistema funziona solo dopo aver accettato la licenza di Xcode
  (`sudo xcodebuild -license`); in alternativa si usa `gmake` (MacPorts o Homebrew)

## Avvio rapido

```bash
make install
make migrate
make dev
```

- Frontend: http://localhost:5173
- API: http://127.0.0.1:8001/api/health, documentazione su http://127.0.0.1:8001/docs

## Comandi

| Comando | Cosa fa |
|---|---|
| `make install` | Installa le dipendenze di backend (uv) e frontend (npm) |
| `make dev` | Avvia backend e frontend in parallelo |
| `make test` | pytest e Vitest |
| `make e2e` | Test end-to-end con Playwright (Chromium), su server e database dedicati |
| `make lint` | ruff, mypy, oxlint, Prettier (controllo) e TypeScript |
| `make format` | Formatta backend e frontend |
| `make gen-api` | Rigenera `frontend/src/api/schema.ts` dallo schema OpenAPI del backend |
| `make migrate` | Applica le migrazioni Alembic al database di sviluppo |

La configurazione del backend si legge da variabili d'ambiente con prefisso `APP_`: vedi
`backend/.env.example`.

## Account

- **Registrazione**: in sviluppo le email non vengono spedite ma stampate nel log del backend
  (nel terminale di `make dev`), con il link di conferma o di reset da aprire nel browser.
- **Il primo account confermato** diventa amministratore e riceve i progetti creati prima che
  esistessero gli account. Dal menu utente → "Amministrazione" si gestiscono gli account
  (conferma manuale, reinvio del link, sospensione); il contenuto dei progetti altrui non è
  visibile. Altri amministratori: `uv run python -m app.cli make-admin --email …`.
- **Utenti da terminale**:
  `cd backend && uv run python -m app.cli create-user --email tu@example.com --password … --verified`
- **Accesso con Google** (facoltativo):
  1. In [Google Cloud Console](https://console.cloud.google.com/) crea un progetto, configura la
     schermata di consenso OAuth e crea delle credenziali "ID client OAuth" di tipo
     "Applicazione web".
  2. Come URI di reindirizzamento autorizzato inserisci
     `http://localhost:5173/api/auth/google/callback` (in produzione: il dominio pubblico).
  3. Metti `APP_GOOGLE_CLIENT_ID` e `APP_GOOGLE_CLIENT_SECRET` in `backend/.env` e riavvia: il
     pulsante "Accedi con Google" compare da solo.
- **Email in produzione**: `APP_EMAIL_BACKEND=smtp` e le variabili `APP_SMTP_*` di qualsiasi
  fornitore SMTP.

## Struttura

```
backend/    API FastAPI (app/, migrations/, tests/)
frontend/   SPA React + Vite + Mantine (src/)
specs/      Specifiche (Spec-Driven Development)
```

## Specifiche

Il progetto segue lo **Spec-Driven Development**: tutte le specifiche sono in [`specs/`](specs/).

| Documento | Contenuto |
|---|---|
| [mission.md](specs/mission.md) | Scopo, pubblico, principi |
| [tech-stack.md](specs/tech-stack.md) | FastAPI + React, database, AI, test |
| [workbook-model.md](specs/workbook-model.md) | Struttura del workbook e modello dei dati |
| [roadmap.md](specs/roadmap.md) | Fasi di sviluppo |

I materiali del corso (PDF e presentazioni) si trovano nella cartella superiore
`~/Development/cpmai/` e **non** fanno parte di questo repository.
