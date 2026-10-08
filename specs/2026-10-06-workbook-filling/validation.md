# Validation: Fase 3 — Compilazione del workbook

## Test automatici

- [x] `make test` termina con codice 0
- [x] `make lint` termina con codice 0
- [x] `make e2e` termina con codice 0

### Copertura richiesta

- [x] Ogni tipo di domanda si salva e si rilegge
- [x] Chiave sconosciuta → 404; iterazione di un altro progetto → 404
- [x] Campi non ammessi dal tipo, scelte fuori elenco e fase di ritorno non valida → 422
- [x] Una risposta svuotata viene eliminata
- [x] Il salvataggio aggiorna la data di modifica di iterazione e progetto
- [x] Avanzamento per fase calcolato correttamente
- [x] Autosave: un solo salvataggio dopo più modifiche ravvicinate; stato di errore e nuovo
      tentativo; salvataggio immediato al cambio di task
- [x] End-to-end: i dati compilati sono ancora presenti dopo il ricaricamento

## Verifiche manuali

- [x] Compilare domande in più task (provato sulla Fase I); l'avanzamento nella barra laterale si aggiorna
- [x] Precedente/Successivo seguono l'ordine del workbook, anche tra fasi diverse
- [x] Il link con `?task=` riapre lo stesso task
- [x] Spegnendo il backend, una modifica mostra l'errore e "Riprova" funziona dopo il riavvio
- [ ] Chiudendo la scheda con una modifica in corso compare l'avviso del browser (implementato,
      non verificabile con il browser di prova: da controllare a mano)

## Definition of Done

Test, lint ed end-to-end verdi, verifiche manuali confermate, voci della Fase 3 spuntate in
`specs/roadmap.md`, branch pronto per il merge su `main`.
