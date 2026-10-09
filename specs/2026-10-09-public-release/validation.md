# Validation: Fase 10 — Preparazione al rilascio pubblico

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0
- [x] Test del backend verdi anche su PostgreSQL; migrazioni da zero su PostgreSQL

### Copertura richiesta

- [x] Registrazione senza accettare i termini → 422; versione dei termini salvata
- [x] Utente senza accettazione della versione corrente: `terms_current` falso, accettazione
      registrata
- [x] Export: contiene progetti, risposte, link (senza token) e marchio; solo i propri dati
- [x] Cancellazione: conferma sbagliata → 422; poi account, progetti, risposte, link, sessioni
      spariti; gli altri utenti intatti; ultimo amministratore protetto
- [x] `cleanup` rimuove solo ciò che è scaduto
- [x] Intestazioni di sicurezza presenti; HSTS solo in produzione
- [x] Rate limit globale → 429
- [x] Log: una riga JSON per richiesta, nessun token, password o contenuto; `X-Request-ID`
- [x] Errore non gestito → 500 generico con id della richiesta
- [x] Configurazione di produzione incompleta → avvio rifiutato con un messaggio chiaro
- [x] SPA servita dal backend: statici, ritorno a `index.html`, `/api` e `/s` non intercettati

## Verifiche manuali

- [x] Build del frontend servita dal backend su una sola porta, con PostgreSQL e
      `APP_ENV=production`: accesso, progetto, risposta salvata, PDF, export, privacy; cookie
      `Secure`/`HttpOnly`, nessuna violazione della CSP nella console
- [ ] Giro: registrazione con consenso, export, cancellazione di un account di prova (coperto dai
      test automatici; la registrazione dal vivo richiede un SMTP, da provare sul server)
- [x] Pagine privacy e termini leggibili, segnaposto evidenti

## Sicurezza

- [x] `security-review.md` completato; dipendenze senza vulnerabilità note aperte

## Contenuti

- [x] Nessuna sequenza lunga di parole in comune tra template e workbook PDF: 0 sequenze da 6
      parole; da 4 solo termini tecnici ("human in the loop", "AI Go/No-Go"). Il PDF è in
      inglese e il template in italiano: il confronto esclude copie letterali, la fedeltà della
      parafrasi resta affidata alla revisione dell'utente (Fase 1)

## Definition of Done

Test verdi su SQLite e PostgreSQL, prova manuale in modalità produzione locale, voci della Fase 10
spuntate in `specs/roadmap.md`, branch pronto per il merge su `main`. Restano da fare con l'utente:
acquisto del server, DNS, revisione legale, credenziali Google reali.
