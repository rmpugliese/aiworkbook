# Fase 18: Pagina iniziale pubblica — Requisiti

## Scope

Chi apre l'indirizzo principale senza aver fatto l'accesso oggi vede solo il modulo "Accedi". La
fase aggiunge una **pagina di presentazione** sull'indirizzo principale, per chi non ha fatto
l'accesso; chi ha fatto l'accesso continua a vedere i propri progetti.

- In alto: titolo e sottotitolo (come la copertina del carosello), "Gratis · in fase
  sperimentale", pulsanti **Registrati gratis** e **Accedi**, e il **video di presentazione**.
- Le funzioni, con testo breve e screenshot statici: compilazione guidata, Go/No-Go, assistente
  AI (con le indicazioni), condivisione con il cliente, PDF con il proprio logo, import dal
  workbook PDF, collaborazione tra colleghi.
- In fondo: invito a registrarsi, privacy in breve (dati in Europa, solo cookie tecnici) e la nota
  "Compatibile con la metodologia CPMAI; non affiliato né approvato da PMI".
- Pagina leggibile su telefono (colonne che si impilano).

Escluso: testi configurabili in Amministrazione, invito alla donazione, notizie o blog, video
o font da servizi esterni, statistiche di visita.

## Decisioni

- **Contenuti statici nel codice** (scelta dell'utente: "informazioni e immagini statiche prese
  dal carosello"): cambiano di rado, non serve un editor.
- **Video sul nostro server**, non su YouTube: nessun cookie di terzi, la CSP resta `'self'`. Il
  video non si scarica finché non si preme play (`preload="none"`, con immagine di copertina).
- Immagini e video importati da Vite: nomi con impronta, cache di un anno.
- Screenshot da progetti di fantasia (Velaria Ricambi, Officine Brenta), senza nomi di modelli
  locali o dati reali.
- Le pagine protette diverse dalla home continuano a mandare a "Accedi" e poi alla pagina chiesta.

## Contesto

- Rotte in `frontend/src/routes.tsx`; guardia `frontend/src/components/RequireAuth.tsx`.
- Materiale: `carosello-linkedin/`, `carosello-novita/`, `screenshot-linkedin/` (fuori dal
  repository); nel repository solo le versioni ridotte usate dalla pagina.
- Nessuna nuova dipendenza; nessuna modifica al backend.
