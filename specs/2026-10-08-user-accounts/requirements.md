# Requirements: Fase 6 — Account utente

## Scope

Ogni persona ha il proprio account e vede solo i propri progetti. Si entra con email e password
(dopo aver confermato l'email) oppure con Google.

### Flussi

| Flusso | Comportamento |
|---|---|
| **Registrazione** | Email, password (10–128 caratteri), nome visualizzato facoltativo. La risposta è sempre la stessa ("controlla la tua email"), anche se l'email esiste già: in quel caso l'email ricevuta avvisa che l'account c'è già. Non si rivela quali email sono registrate |
| **Conferma email** | Link con token monouso valido 24 ore; aprendolo l'account è confermato e l'utente entra. Si può chiedere un nuovo link |
| **Login** | Solo con email confermata. Errore generico "Email o password non validi"; se la password è giusta ma l'email non è confermata, lo si dice e si offre il reinvio del link |
| **Password dimenticata** | Si inserisce l'email (risposta sempre uguale); il link (valido 1 ora, monouso) porta a una pagina per scegliere la nuova password. Il cambio chiude tutte le sessioni aperte |
| **Google** | "Accedi con Google" (OpenID Connect). Si accetta solo un'email verificata da Google. Se esiste già un account con quell'email, lo si collega (e risulta confermato); altrimenti se ne crea uno nuovo senza password. Il pulsante compare solo se Google è configurato |
| **Logout** | Chiude la sessione corrente |

### Sessioni e sicurezza

- Sessione lato server: nel DB c'è solo l'hash SHA-256 del token; il browser ha il token in un
  cookie `HttpOnly`, `SameSite=Lax`, `Secure` in produzione.
- Durata **30 giorni, rinnovata con l'uso** (al massimo una volta al giorno, per non scrivere sul
  DB a ogni richiesta).
- Password con hash **Argon2** (`pwdlib`).
- **CSRF**: double-submit cookie. Il backend imposta un cookie `csrf_token` leggibile dal frontend,
  che lo rimanda nell'header `X-CSRF-Token` su ogni richiesta `POST`, `PUT`, `PATCH` e `DELETE`
  verso `/api`; senza corrispondenza → 403.
- Token di conferma e di reset: casuali (256 bit), nel DB solo l'hash, monouso, a scadenza.
- **Rate limiting** in memoria (sufficiente per una sola istanza): 5 login falliti per email in
  15 minuti; 5 richieste di registrazione, reinvio o reset per indirizzo IP all'ora → 429.

### Proprietà dei dati

- `projects.owner_id`: ogni progetto appartiene a un utente. Tutte le API di progetti, iterazioni,
  risposte ed export filtrano per proprietario; i progetti altrui risultano **404** (non 403, per
  non rivelarne l'esistenza).
- **Dati esistenti**: i progetti creati in modalità locale (senza proprietario) vengono assegnati
  al **primo utente** che conferma l'account.
- Restano pubblici solo `GET /api/health` e `GET /api/template…`.

### Amministrazione (aggiunta durante la fase)

- Il **primo account confermato** diventa amministratore (anche nei database che avevano già
  account: la migrazione promuove il primo confermato). Altri amministratori con
  `python -m app.cli make-admin --email …` o `create-user --admin`.
- Pagina "Amministrazione" (voce nel menu utente, solo per amministratori; `/api/admin/*` → 403
  agli altri): elenco degli account con stato, data di iscrizione, ultimo accesso e numero di
  progetti; azioni: conferma manuale dell'email, reinvio del link, sospensione e riattivazione.
- La **sospensione** chiude subito tutte le sessioni dell'utente e blocca l'accesso (423, anche
  con Google) finché non viene riattivato. Un amministratore non può sospendere sé stesso.
- L'amministratore **non vede il contenuto dei progetti** altrui: per lui valgono le stesse regole
  di isolamento di tutti gli altri utenti.

### Email

- Interfaccia unica `send_email(to, subject, text)` con tre backend:
  - `console` (default in sviluppo): l'email, con il link, compare nel log del backend;
  - `smtp`: qualsiasi server SMTP (host, porta, utente, password, mittente, STARTTLS) da
    variabili d'ambiente;
  - `memory`: per i test.
- Testi in italiano, solo testo semplice. I link puntano a `APP_PUBLIC_URL` (in sviluppo
  `http://localhost:5173`).

### API

| Metodo | Percorso |
|---|---|
| `POST` | `/api/auth/register`, `/api/auth/verify-email`, `/api/auth/resend-verification` |
| `POST` | `/api/auth/login`, `/api/auth/logout` |
| `POST` | `/api/auth/password-reset/request`, `/api/auth/password-reset/confirm` |
| `GET` | `/api/auth/me` (401 se non autenticato), `/api/auth/csrf` (imposta il cookie CSRF), `/api/auth/providers` |
| `GET` | `/api/auth/google/login`, `/api/auth/google/callback` |

### Interfaccia

- Pagine: Accedi, Registrati, "Controlla la tua email", Conferma email, Password dimenticata,
  Nuova password. Tutte in italiano, con messaggi d'errore chiari.
- Tutte le altre pagine richiedono l'accesso: senza sessione si va su "Accedi" e, dopo il login,
  si torna alla pagina richiesta.
- Nell'header: nome (o email) dell'utente e "Esci".
- Se una richiesta riceve 401 (sessione scaduta), l'app torna alla pagina di accesso.

### Strumenti

- Comando `uv run python -m app.cli create-user --email … --password … [--verified]` per creare
  utenti da terminale (usato anche dai test end-to-end).

### Escluso

- Altri provider (Microsoft, LinkedIn…), autenticazione a due fattori
- Modifica di email e password dal profilo, eliminazione dell'account (Fase 9, GDPR)
- Scelta del fornitore email di produzione (al rilascio)

## Decisions

- **SMTP generico + log in sviluppo**: nessun fornitore scelto ora.
- **Google subito**, con **Authlib** (nuova dipendenza, insieme a `itsdangerous` per il cookie
  firmato che conserva `state` e `nonce` durante il redirect) e `pwdlib[argon2]` per le password.
- **Conferma obbligatoria** prima del primo accesso.
- **Sessione di 30 giorni rinnovata con l'uso**.
- **Migrazioni su SQLite con chiavi esterne disattivate** (emerso nella verifica): la modalità
  batch ricrea le tabelle e, con le chiavi esterne attive, eliminava a cascata iterazioni e
  risposte. Un test di migrazione con dati reali lo impedisce.
- **404 per le risorse altrui**, **risposte uniformi** su registrazione e reset, per non rivelare
  quali email esistono.
- Il callback di Google passa dal proxy del frontend (`APP_PUBLIC_URL/api/auth/google/callback`),
  così cookie e redirect restano sulla stessa origine.

## Context

- Nuove variabili: `APP_SECRET_KEY`, `APP_PUBLIC_URL`, `APP_EMAIL_BACKEND`, `APP_SMTP_*`,
  `APP_GOOGLE_CLIENT_ID`, `APP_GOOGLE_CLIENT_SECRET`, documentate in `.env.example`.
- In produzione `APP_SECRET_KEY` è obbligatoria e i cookie sono `Secure`.
- I test del backend usano un client già autenticato per default, più un client anonimo per i
  flussi di accesso; Google è simulato.
