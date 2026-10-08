# AI Project Workbook

Applicazione web per compilare il workbook della metodologia CPMAI progetto per progetto e
iterazione per iterazione. Salva le risposte in un database, genera il documento finale,
permette di condividerlo in sola lettura con il cliente e offre un assistente AI su richiesta.

"AI Project Workbook" è il nome provvisorio; quello definitivo si sceglie prima del rilascio
pubblico.

## Prerequisiti

- [uv](https://docs.astral.sh/uv/), che installa anche Python 3.13
- Node.js 24 e npm
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
