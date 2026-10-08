# Validation: Fase 4 — Valutazione Go/No-Go

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0

### Copertura richiesta

- [x] Esito della Fase I: NO-GO se c'è un NO-GO, MAYBE se c'è un MAYBE, GO se tutti GO,
      "da completare" con fattori mancanti
- [x] Verdetto suggerito delle Fasi II–VI secondo i criteri spuntati
- [x] Fase di ritorno suggerita: la più a monte tra quelle dei criteri mancanti; nessuna se non ce
      ne sono
- [x] Server: `return_to_phase` con verdetto GO o senza verdetto → 422
- [x] Interfaccia: spuntare i criteri aggiorna il suggerimento; lo scostamento è evidenziato; la
      fase di ritorno si azzera scegliendo GO
- [x] Riepilogo: matrice della Fase I e stato di tutte le fasi

## Verifiche manuali

- [ ] Compilare i 9 fattori e vedere l'esito suggerito nella Fase I (coperto dai test unitari, da
      provare a mano sul template reale)
- [x] In un Go/No-Go di fase, lasciare criteri non spuntati e verificare verdetto e fase di
      ritorno suggeriti
- [x] Scegliere un verdetto diverso dal suggerito e vedere l'avviso finché manca la motivazione
- [x] Lo stato delle fasi compare nell'indice e nel riepilogo
- [x] Le voci di fase dell'indice sono pulsanti raggiungibili da tastiera (emerso dal test end-to-end)

## Definition of Done

Test verdi, verifiche manuali confermate, voci della Fase 4 spuntate in `specs/roadmap.md`, branch
pronto per il merge su `main`.
