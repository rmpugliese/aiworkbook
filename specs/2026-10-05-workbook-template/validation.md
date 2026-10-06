# Validation: Fase 1 — Definizione strutturata del workbook

## Test automatici

- [x] `make test` termina con codice 0
- [x] `make lint` termina con codice 0

### Copertura richiesta

- [x] Il template v1 si carica e supera la validazione
- [x] 6 fasi, numerate da 1 a 6 nell'ordine del workbook
- [x] Chiavi delle domande uniche e con prefisso coerente con la gerarchia
- [x] 9 domande `go_no_go`, 3 per ciascun gruppo (`business`, `data`, `execution`)
- [x] 1 domanda `multi_choice` con i 7 pattern di AI
- [x] Ogni task ha una `guidance` non vuota; ogni domanda ha `prompt` e `help` non vuoti
- [x] I validatori rifiutano: chiave duplicata, prefisso errato, `options` mancanti, campi
      sconosciuti
- [x] Ogni fase termina con un solo `phase_gate`; `return_to` punta solo a fasi precedenti; la
      Fase I non ha criteri
- [x] `GET /api/template` e `GET /api/template/1` rispondono 200; `GET /api/template/99` risponde
      404

## Verifiche manuali

- [x] `http://127.0.0.1:8001/docs` mostra i due endpoint del template
- [x] Confronto con il PDF fase per fase: ogni domanda del workbook ha la sua corrispondente,
      nello stesso ordine
- [x] `frontend/src/api/schema.ts` è rigenerato e include i tipi del template

## Contenuti (revisione del fondatore)

- [x] Fase I rivista
- [x] Fasi II e III riviste
- [x] Fasi IV, V e VI riviste
- [x] Go/No-Go di fase (I–VI) rivisti
- [x] Nessuna frase copiata o tradotta alla lettera dal PDF
- [x] Terminologia coerente in tutto il file (es. "iterazione", "cognitivo", "KPI")

## Definition of Done

Test e lint verdi, revisione dei contenuti completata dal fondatore, voci della Fase 1 spuntate
in `specs/roadmap.md`, branch pronto per il merge su `main`.
