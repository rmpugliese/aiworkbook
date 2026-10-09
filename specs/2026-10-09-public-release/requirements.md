# Requirements: Fase 10 — Preparazione al rilascio pubblico

## Scope

Rendere l'app pronta per utenti esterni: conforme al GDPR, robusta in produzione, pubblicabile
con un container su una VPS europea. Il deploy vero si fa quando c'è il server.

### 1. Privacy e GDPR

- **Bozze di privacy policy e termini d'uso** in italiano, pagine pubbliche `/privacy` e
  `/terms`. Descrivono ciò che l'app fa davvero: dati dell'account, contenuti dei progetti,
  marchio, assistente AI (dati inviati all'endpoint configurato solo con il consenso per
  progetto), link condivisi, cookie tecnici, log, conservazione. I dati del titolare sono segnaposto
  da completare (`[NOME DEL TITOLARE]`…) e una nota in testa dice che vanno riviste da un legale.
- **Consenso alla registrazione**: casella obbligatoria "Accetto i termini e ho letto
  l'informativa", con data e versione salvate sull'utente; anche per chi entra con Google la prima
  volta (pagina di accettazione prima di usare l'app). Se la versione cambia, si richiede di nuovo.
- **Esportazione dei dati** (portabilità): dal profilo, un file JSON con account, marchio (logo in
  base64), progetti, iterazioni, risposte, link condivisi (senza token) e registro dell'assistente.
- **Cancellazione dell'account**: dal profilo, confermando con l'email; elimina account, sessioni,
  progetti con tutto il contenuto, link e logo. Il registro AI perde il riferimento al progetto
  (`SET NULL`) e viene cancellato con l'utente. Un amministratore non può cancellarsi se è l'unico.
- **Conservazione**: comando `cleanup` (da pianificare ogni giorno) che rimuove sessioni scadute,
  token email usati o scaduti, registro AI oltre 12 mesi.

### 2. Sicurezza

- **Intestazioni** su tutte le risposte dell'app: `Content-Security-Policy` (solo risorse proprie,
  immagini anche `data:`/`blob:`), `X-Content-Type-Options`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy`; in produzione
  `Strict-Transport-Security`. Le pagine condivise mantengono la loro politica più stretta.
- **Rate limiting globale** per IP su `/api` (300 richieste al minuto), oltre ai limiti specifici.
- **IP reale dietro il proxy**: Uvicorn con `--proxy-headers` e `--forwarded-allow-ips` limitato al
  proxy.
- **Revisione OWASP** documentata in `security-review.md` con esito e correzioni; controllo delle
  dipendenze con `npm audit` e `pip-audit` (eseguito al volo, non come dipendenza).
- **Configurazione di produzione** che si rifiuta di partire se mancano `APP_SECRET_KEY` robusta,
  `APP_PUBLIC_URL` in `https://`, database non SQLite, backend email reale.

### 3. Produzione

- **PostgreSQL** con il driver `psycopg[binary]`; migrazioni e test passano anche su PostgreSQL
  (in locale con PostgreSQL di Homebrew, in CI con un servizio).
- **Un solo processo**: il backend serve la build del frontend (file statici e ritorno a
  `index.html` per le rotte della SPA), così c'è una sola origine.
- **Container**: `Dockerfile` multi-stage (build del frontend con Node, runtime Python con Pango),
  `docker-compose.yml` con app, PostgreSQL e Caddy (HTTPS automatico), `.env.example`, servizio di
  backup giornaliero (`pg_dump` compresso, conservazione 14 giorni), migrazioni all'avvio.
- **Guida al deploy** `DEPLOY.md`: server, DNS, variabili, primo avvio, primo amministratore,
  backup e ripristino, aggiornamenti.
- **CI**: workflow GitHub Actions pronto (lint, test su SQLite e PostgreSQL, e2e, build
  dell'immagine), attivo quando il codice sarà su GitHub.

### 4. Log e monitoraggio

- **Log JSON su stdout**, una riga per richiesta: id della richiesta (anche nell'intestazione
  `X-Request-ID`), metodo, percorso, stato, durata, id utente. Mai corpi, risposte, cookie,
  password o token: il token nei percorsi `/s/<token>` è oscurato.
- Eccezioni non gestite: registrate con lo stack e l'id della richiesta; al client un 500 generico
  con l'id da citare.
- `GET /api/health` per il monitoraggio dell'uptime (già presente).

### 5. Nome e contenuti

- Nome confermato **AI Project Workbook** (descrittivo, nessun marchio PMI).
- Verifica automatica una tantum che i testi del template non riprendano frasi del workbook PDF
  (confronto di sequenze di parole), con esito in `validation.md`.

## Decisions

- **Container Docker generico** (scelta dell'utente): portabile su qualsiasi VPS europea.
- **Bozze legali da far rivedere** (scelta dell'utente): non sono consulenza legale.
- **Log strutturati senza servizi esterni** (scelta dell'utente): nessun dato a terzi.
- **PostgreSQL di Homebrew** per le prove locali (approvato); Docker non è installato, quindi la
  prima build dell'immagine avverrà sul server o in CI.
- Nuova dipendenza backend `psycopg[binary]` (approvata con PostgreSQL).

## Context

- Impostazioni in `app/config.py` (prefisso `APP_`); middleware in `app/main.py`.
- Rate limiter in memoria: basta per un solo processo, come previsto dal deploy.
- Fuori scope: piani a pagamento, CAPTCHA, cookie banner (solo cookie tecnici, non serve),
  monitoraggio esterno (Sentry), alta disponibilità.
