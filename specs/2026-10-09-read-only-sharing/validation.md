# Validation: Fase 8 — Condivisione in sola lettura

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0

### Copertura richiesta

- [x] Il token ha almeno 256 bit casuali; nel database c'è solo il suo hash
- [x] Il link completo compare solo nella risposta di creazione, mai nell'elenco
- [x] La pagina pubblica mostra progetto, user story, risposte e "Non compilato", senza form né
      script, con l'HTML degli utenti escapato
- [x] Il PDF condiviso è un PDF valido con il nome del file atteso
- [x] 404 identico per token sconosciuto, revocato, scaduto, di un progetto archiviato o
      eliminato
- [x] Con il token non si può modificare nulla: le API del progetto restano 401 senza sessione
- [x] Le API dei link di progetti altrui rispondono 404
- [x] Intestazioni: noindex, no-referrer, no-store, CSP, frame vietati
- [x] Limite di richieste per IP → 429
- [x] Ultimo accesso e contatore si aggiornano a ogni apertura
- [x] Interfaccia: creazione con link mostrato una volta e copiabile, revoca con conferma,
      stati attivo/scaduto/revocato, eliminazione dei link non attivi

## Verifiche manuali

- [x] Creare un link e aprirlo senza sessione: report leggibile su schermo e a 375 px senza
      scorrimento orizzontale; "Scarica PDF" funziona (copia del database e test e2e)
- [x] Modificare una risposta e ricaricare il link: si vede la versione nuova (test automatici)
- [x] Revocare il link: la pagina senza sessione mostra la pagina 404 (test e2e)
- [x] Archiviare il progetto: il link non funziona; ripristinarlo: torna a funzionare (test
      automatici)

## Sicurezza

- [x] La pagina pubblica non mostra email del consulente né link ad altre risorse
- [x] Nessun endpoint pubblico accetta metodi diversi da GET

## Contenuti

- [x] I nuovi testi dell'interfaccia sono nostri; nessun testo del workbook PMI aggiunto

## Definition of Done

Test verdi, prova manuale in una finestra anonima, voci della Fase 8 spuntate in
`specs/roadmap.md`, branch pronto per il merge su `main`.
