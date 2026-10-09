# Plan: Fase 8 — Condivisione in sola lettura

## Gruppo 1: Modello e migrazione

1. `app/models/share.py`: `ShareLink` (iteration_id con `ondelete=CASCADE`, created_by,
   label, token_hash univoco, created_at, expires_at, revoked_at, last_accessed_at,
   access_count); relazione dall'iterazione con cancellazione a cascata
2. Migrazione Alembic `share_links` (backup di `dev.db` prima di applicarla)

## Gruppo 2: Servizi

3. `app/services/sharing.py`:
   - `create_link(db, project_id, iteration_id, owner_id, label, expires_in_days)` → link e
     token in chiaro (l'unica volta)
   - `list_links`, `revoke_link`, `delete_link` (solo se revocato o scaduto, altrimenti 409)
   - `resolve(db, token)` → iterazione e progetto, oppure `NotFoundError` per token
     sconosciuto, revocato, scaduto o progetto archiviato; aggiorna ultimo accesso e contatore
4. `app/services/export.py`: report da un'iterazione già risolta, senza `owner_id`

## Gruppo 3: API e pagina pubblica

5. Schemi `ShareLinkIn` (label, expires_in_days ∈ {null, 7, 30, 90}), `ShareLinkOut` (con
   `status`), `ShareLinkCreated` (con `url`)
6. Router del proprietario sotto `/api/projects/{pid}/iterations/{iid}/shares`: GET, POST,
   `POST …/{sid}/revoke`, DELETE `…/{sid}`
7. Router pubblico `app/routers/share.py`: `GET /s/{token}` (HTML) e `GET /s/{token}/pdf`;
   intestazioni di sicurezza; pagina 404 generica; limiti per IP
8. `render_html(report, shared=...)`: barra in alto con "Scarica PDF" e foglio di stile per lo
   schermo (`@media screen`), senza cambiare il PDF
9. Vite: proxy anche per `/s`; impostazione `APP_PUBLIC_URL` per comporre il link (in sviluppo
   `http://localhost:5173`)

## Gruppo 4: Frontend

10. `api/shares.ts`: hook per elenco, creazione, revoca, eliminazione
11. `components/ShareModal.tsx`: form (etichetta, scadenza), link appena creato con "Copia" e
    avviso che si vede una sola volta, elenco con stato, ultimo accesso, "Revoca" (con conferma)
    ed "Elimina"
12. Pulsante "Condividi" nella pagina dell'iterazione, accanto a "Scarica PDF"

## Gruppo 5: Test e documenti

13. Backend: creazione e hash, token mai restituito dopo la creazione, pagina pubblica 200 con
    risposte e senza form, PDF, 404 per token sconosciuto, revocato, scaduto e progetto
    archiviato, 404 per i link di progetti altrui, cascata alla cancellazione, nessuna modifica
    possibile con il token, intestazioni, escape dell'HTML, limite per IP, contatore di accessi
14. Frontend: modale (creazione e link mostrato una volta, revoca con conferma, stati)
15. E2E: creare un link, aprirlo in un contesto senza login, vedere una risposta, revocarlo,
    404
16. `CLAUDE.md`, `README.md`, `specs/roadmap.md`
