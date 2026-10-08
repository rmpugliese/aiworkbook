# Plan: Fase 6 — Account utente

## Gruppo 1: Modelli e configurazione

1. Dipendenze: `pwdlib[argon2]`, `authlib`, `itsdangerous`
2. Settings: chiave segreta, URL pubblico, email, Google; controllo della chiave in produzione
3. Modelli `User`, `Session`, `EmailToken`; `Project.owner_id`; migrazione

## Gruppo 2: Servizi

4. `app/auth/passwords.py`, `tokens.py` (generazione e hash), `rate_limit.py`
5. `app/email.py`: backend `console`, `smtp`, `memory`; testi delle email
6. `app/services/auth.py`: registrazione, conferma, reinvio, login, logout, reset, sessioni
   (creazione, lettura, rinnovo), collegamento Google, assegnazione dei progetti esistenti
7. Servizi di progetti, iterazioni, risposte ed export: filtro per proprietario

## Gruppo 3: API

8. Dipendenza `current_user`; middleware CSRF
9. Router `auth` (inclusi Google login e callback); router dei progetti protetto
10. `app/cli.py`: `create-user`

## Gruppo 4: Test backend

11. Fixture: client autenticato (default) e anonimo; outbox delle email
12. Test dei flussi: registrazione (anche con email esistente), conferma (scaduta, riusata),
    login (sbagliato, non confermato), reinvio, reset, logout, sessione scaduta e rinnovata,
    CSRF, rate limiting, Google simulato (nuovo utente, collegamento, email non verificata)
13. Test dell'isolamento: un utente non vede né modifica progetti, iterazioni, risposte ed export
    di un altro (404); assegnazione dei progetti esistenti al primo utente

## Gruppo 5: Frontend

14. `apiSend` con header CSRF; gestione globale del 401
15. `useMe`, `RequireAuth`, menu utente nell'header
16. Pagine di accesso, registrazione, conferma, password dimenticata e nuova password
17. Test dei componenti

## Gruppo 6: End-to-end e documentazione

18. Playwright: utente creato con la CLI, login dall'interfaccia, poi i test esistenti
19. README: variabili d'ambiente, come leggere le email in sviluppo, come configurare Google
