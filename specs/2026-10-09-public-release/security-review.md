# Revisione di sicurezza — Fase 10

Revisione del codice rispetto all'OWASP Top 10 (2021), al 9 ottobre 2026. Esito: nessun problema
aperto ad alto rischio; una correzione minore applicata, alcuni rischi accettati e documentati.

## A01 — Controllo degli accessi

- Ogni endpoint sui progetti richiede la sessione e passa `owner_id` ai servizi; le risorse altrui
  risultano 404 (test `test_isolation.py`, `test_shares.py`, `test_ai.py`).
- L'amministratore gestisce gli account ma non vede i contenuti dei progetti.
- Il logo si serve solo al proprietario; le pagine condivise solo con un token valido.
- Esportazione e cancellazione riguardano solo l'utente collegato.

## A02 — Crittografia

- Password con Argon2id; confronto a tempo costante anche per email inesistenti.
- Token di sessione, email e link condivisi: 256 bit casuali, nel database solo lo SHA-256.
- API key dell'AI cifrata con Fernet (chiave derivata da `APP_SECRET_KEY`).
- In produzione: HTTPS (Caddy), cookie `Secure`, HSTS; avvio rifiutato con segreto debole.

## A03 — Iniezione

- Solo SQLAlchemy con parametri; nessuna query composta a mano con input dell'utente.
- Jinja con autoescape (test sull'escape); React senza `dangerouslySetInnerHTML`.
- Il colore del marchio, inserito nel CSS dei documenti, è validato `#rrggbb`.
- SVG caricati: rifiutati con script, eventi, `javascript:`, entità o risorse esterne.

## A04 — Progettazione

- Limiti: tentativi di accesso per email, email per IP, assistente AI per utente, pagine
  condivise e PDF per IP, globale su `/api` per IP.
- Registrazione e recupero password non rivelano se un'email è registrata.

## A05 — Configurazione

- Intestazioni su tutte le risposte: CSP (solo risorse proprie), `nosniff`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, COOP; CSP ancora più stretta sulle pagine condivise e
  sul logo (`sandbox`).
- Documentazione interattiva dell'API (`/docs`) disattivata in produzione.
- Nessun CORS: una sola origine.

## A06 — Componenti vulnerabili

- `npm audit` (frontend): 0 vulnerabilità. `pip-audit` (backend): nessuna vulnerabilità nota.
- La CI ripete entrambi gli audit a ogni push.

## A07 — Autenticazione

- Sessioni lato server con scadenza a 30 giorni dall'ultimo uso; nuova sessione a ogni accesso
  (niente fissazione); il reset della password chiude tutte le sessioni; gli account sospesi non
  passano.
- Email confermata obbligatoria prima dell'accesso.
- **Corretto**: il ritorno dopo l'accesso (`safeNext`) rifiutava `//host` ma non `/\host`, che
  alcuni browser interpretano come un altro sito. Ora sono rifiutati entrambi (con test).

## A08 — Integrità

- Nessuna deserializzazione di dati non fidati; dipendenze bloccate da `uv.lock` e
  `package-lock.json`; immagine costruita dalla CI.

## A09 — Log e monitoraggio

- Log JSON per richiesta con id; mai corpi, query string, cookie o token (il token in `/s/…` è
  oscurato); log di accesso di Uvicorn e Caddy disattivati perché mostrerebbero i token.
- Errori non gestiti: stack nel log, al client solo un messaggio generico con l'id.

## A10 — SSRF

- La generazione del PDF può caricare solo URI `data:` (niente rete, niente file locali).
- L'URL dell'assistente AI lo imposta solo l'amministratore: **rischio accettato**, perché un
  amministratore può già configurare il server; va indicato a chi gestisce l'istanza.

## CSRF e caricamenti

- Doppio cookie CSRF su tutte le richieste che modificano dati, `SameSite=Lax`.
- Corpo delle richieste limitato a 2 MB da Caddy; il logo è letto al massimo fino a 1 MB + 1 byte.

## Rischi accettati

- **Cancellazione dell'account** con la sola conferma dell'email (non la password): richiede una
  sessione valida e il token CSRF. Si può rafforzare chiedendo la password o un'email di
  conferma.
- **Limiti in memoria**: validi con un solo processo, come previsto dal deploy.
- **Nessun CAPTCHA** alla registrazione: i limiti per IP e la conferma via email bastano per un
  lancio gratuito; da rivalutare se arrivano registrazioni automatiche.
