# Validation: Fase 0 — Scaffolding del monorepo

La fase è completa e pronta per il merge quando tutto quanto segue è verificato.

## Test automatici

- [x] `make test` termina con codice 0 (pytest e Vitest)
- [x] `make lint` termina con codice 0 (ruff, mypy, oxlint, Prettier, `tsc -b`)

### Copertura richiesta

- [x] `GET /api/health` risponde 200 con `status`, `version` e `database`
- [x] Con DB raggiungibile: `status == "ok"` e `database == "ok"`
- [x] Con DB non raggiungibile: `status == "degraded"` e `database == "error"`
- [x] `Layout` mostra "AI Project Workbook" nell'header
- [x] `Home` mostra lo stato online quando il backend risponde e un messaggio d'errore quando non
      risponde

## Verifiche manuali

- [x] `make install` su un clone pulito installa tutto senza errori
- [x] `make dev` avvia backend (8001) e frontend (5173); su `http://localhost:5173` si vede il
      layout con il badge "Backend online"
- [x] Fermando il backend e ricaricando, la home mostra "Backend non raggiungibile"
- [x] `http://localhost:8001/docs` mostra la documentazione OpenAPI
- [x] `make gen-api` rigenera `frontend/src/api/schema.ts` senza differenze se l'API non è cambiata
- [x] `make migrate` applica la migrazione baseline e crea `backend/dev.db`

## Contenuti

- [x] Nessun testo del workbook PMI presente nel codice
- [x] Il nome "AI Project Workbook" è definito in un solo punto del frontend

## Definition of Done

Test e lint verdi, verifiche manuali confermate, nessun TODO lasciato, voci della Fase 0 spuntate
in `specs/roadmap.md`, branch pronto per il merge su `main`.
