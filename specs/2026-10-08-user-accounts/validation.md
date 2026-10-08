# Validation: Fase 6 — Account utente

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0

### Copertura richiesta

- [x] Registrazione: email inviata; stessa risposta se l'email esiste già; password troppo corta
      → 422
- [x] Conferma: il link funziona una sola volta; scaduto → errore; dopo la conferma l'utente è
      dentro
- [x] Login: credenziali sbagliate → 401 generico; email non confermata → messaggio dedicato
- [x] Reset: link monouso, scadenza, cambio password che chiude le altre sessioni
- [x] Sessione: scaduta → 401; rinnovata con l'uso; logout la chiude
- [x] CSRF: richiesta senza header o con valore diverso → 403
- [x] Rate limiting → 429
- [x] Google: nuovo utente, collegamento a un account esistente, email non verificata rifiutata
- [x] Isolamento: 404 su progetti, iterazioni, risposte ed export di un altro utente; elenco
      limitato ai propri progetti
- [x] I progetti senza proprietario passano al primo utente confermato
- [x] Amministrazione: primo account confermato amministratore (anche via migrazione); API
      riservata (403); elenco con attività; conferma manuale; sospensione che chiude le sessioni e
      blocca l'accesso (423); riattivazione; niente autosospensione; nessun accesso ai progetti
      altrui
- [x] Frontend: redirect all'accesso e ritorno alla pagina richiesta; menu utente; pagine dei
      flussi

## Verifiche manuali

- [x] Registrarsi, trovare il link nel log del backend, confermare, entrare
- [x] I propri progetti esistenti sono visibili dopo la prima conferma (su una copia del
      database reale)
- [x] La migrazione conserva iterazioni e risposte (difetto trovato e corretto, con test)
- [x] Il menu utente compare subito dopo l'accesso (difetto trovato e corretto, con test)
- [x] Password dimenticata → link nel log → nuova password → accesso
- [ ] Google con un client OAuth reale (serve creare il client su Google Cloud Console)
- [x] Un secondo utente non vede i progetti del primo (test automatici di isolamento)

## Definition of Done

Test verdi, verifiche manuali confermate, voci della Fase 6 spuntate in `specs/roadmap.md`, branch
pronto per il merge su `main`.
