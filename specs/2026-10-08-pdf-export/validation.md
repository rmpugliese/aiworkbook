# Validation: Fase 5 — Esportazione PDF

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0

### Copertura richiesta

- [x] Ogni tipo di risposta è presentato come da requirements; le domande senza risposta
      risultano "Non compilato"
- [x] Esito della Fase I calcolato come nel frontend
- [x] L'HTML contiene copertina, indice, user story, riepilogo e le 6 fasi; il testo degli utenti
      è escapato
- [x] L'endpoint restituisce un PDF valido con il nome file atteso; il testo del PDF contiene
      titoli e risposte
- [x] 404 per iterazione di un altro progetto

## Verifiche manuali

- [x] Scaricare il PDF dell'iterazione reale e aprirlo: copertina, indice con numeri di pagina
      corretti, intestazioni e piè di pagina, una fase per pagina
- [x] Verdetti leggibili anche stampando in bianco e nero (l'etichetta è sempre scritta)
- [x] Il CSS non viene escapato da Jinja (difetto trovato nella verifica: font, intestazioni e
      numeri di pagina sparivano)
- [x] Testi lunghi e con a capo impaginati correttamente (a capo verificati nei test; da rivedere
      con un'iterazione compilata per intero)

## Definition of Done

Test verdi, PDF verificato a mano, voci della Fase 5 spuntate in `specs/roadmap.md`, branch
pronto per il merge su `main`.
