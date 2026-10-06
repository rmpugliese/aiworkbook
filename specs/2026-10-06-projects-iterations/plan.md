# Plan: Fase 2 — Progetti e iterazioni

## Gruppo 1: Modelli e migrazione

1. `app/models/`: `Project`, `Iteration`, `Answer` (SQLAlchemy 2.x tipizzato), chiavi esterne con
   `ON DELETE CASCADE`, vincoli di unicità `(project_id, number)` e `(iteration_id, question_key)`
2. `app/db.py`: `PRAGMA foreign_keys=ON` per SQLite
3. Migrazione Alembic autogenerata e verificata a mano

## Gruppo 2: Servizi

4. `app/services/projects.py`: elenco, creazione (con iterazione 1), modifica, archiviazione,
   ripristino, eliminazione con conferma del nome
5. `app/services/iterations.py`: creazione vuota o per copia (risposte + user story), modifica,
   numerazione progressiva

## Gruppo 3: API

6. `app/schemas/projects.py`: schemi Pydantic di input e output
7. `app/routers/projects.py`: endpoint come da requirements, con mappatura degli errori
   (404, 409, 422)
8. Registrazione in `app/main.py`, `make gen-api`

## Gruppo 4: Test backend

9. `tests/test_projects_api.py`: CRUD, ordinamento, archiviazione, eliminazione (409 se non
   archiviato, 422 se il nome è sbagliato, cascata su iterazioni e risposte)
10. `tests/test_iterations_api.py`: numerazione, copia (risposte e user story), copia da
    un'iterazione di un altro progetto rifiutata, 404 incrociati

## Gruppo 5: Frontend

11. `src/api/client.ts`: `apiSend` per POST, PATCH e DELETE con gestione di `detail`
12. `src/api/projects.ts`: query e mutation di TanStack Query
13. `src/pages/ProjectsPage.tsx`: elenco, filtro archiviati, modale "Nuovo progetto"
14. `src/pages/ProjectPage.tsx`: dati modificabili, iterazioni, modale "Nuova iterazione",
    archiviazione, eliminazione con conferma del nome
15. `src/pages/IterationPage.tsx`: intestazione, user story modificabile, avviso Fase 3
16. Indicatore dello stato del backend nell'header; rotte in `App.tsx`

## Gruppo 6: Test frontend e verifica

17. Test: elenco progetti (vuoto e pieno), creazione, pulsante di eliminazione abilitato solo con
    il nome corretto, nuova iterazione per copia
18. Verifica manuale nel browser del percorso completo
