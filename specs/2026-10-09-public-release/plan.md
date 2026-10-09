# Plan: Fase 10 — Preparazione al rilascio pubblico

## Gruppo 1: PostgreSQL

1. Dipendenza `psycopg[binary]`; PostgreSQL 17 di Homebrew per le prove
2. Test e migrazioni su PostgreSQL tramite `APP_TEST_DATABASE_URL` (fixture che crea e svuota uno
   schema); correzioni di eventuali differenze

## Gruppo 2: GDPR

3. Utente: `terms_accepted_at`, `terms_version`; migrazione
4. Registrazione con `accept_terms` obbligatorio; `POST /api/auth/me/accept-terms`; `UserOut` con
   `terms_current`
5. `GET /api/auth/me/export` (JSON scaricabile) e `DELETE /api/auth/me` (conferma con email)
6. Comando `cleanup`
7. Frontend: pagine `/privacy` e `/terms`, casella alla registrazione, pagina di accettazione per
   chi non ha accettato la versione corrente, sezione "I tuoi dati" nel profilo (esporta,
   elimina), link nel piè di pagina

## Gruppo 3: Sicurezza

8. Middleware delle intestazioni di sicurezza; rate limit globale su `/api`
9. Validazione della configurazione di produzione
10. Revisione OWASP e audit delle dipendenze → `security-review.md`, con le correzioni

## Gruppo 4: Log

11. Middleware di log JSON con id della richiesta e oscuramento dei token; gestore degli errori 500

## Gruppo 5: Produzione

12. Il backend serve `frontend/dist` (statici + ritorno alla SPA)
13. `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.env.example`, backup, `.dockerignore`
14. `.github/workflows/ci.yml`
15. `DEPLOY.md`, README, tech stack

## Gruppo 6: Contenuti e verifica

16. Confronto dei testi del template con il PDF (script una tantum fuori dal repository)
17. Test: consenso, export, cancellazione a cascata, cleanup, intestazioni, rate limit globale,
    log senza dati sensibili, configurazione di produzione, SPA servita dal backend
