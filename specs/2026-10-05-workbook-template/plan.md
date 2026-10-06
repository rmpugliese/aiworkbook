# Plan: Fase 1 — Definizione strutturata del workbook

## Gruppo 1: Schema

1. Aggiungere `pyyaml` (runtime) e `types-PyYAML` (dev)
2. `app/workbook/schema.py`: modelli Pydantic `Template`, `Phase`, `TaskGroup`, `Task`,
   `Question` (unione discriminata su `type`: `TextQuestion`, `GoNoGoQuestion`,
   `MultiChoiceQuestion`), `ChoiceOption`; tutti con `extra="forbid"` e `frozen=True`
3. Validatore a livello di `Template`: chiavi uniche, prefissi coerenti, fasi 1–6 in ordine,
   chiavi di opzione uniche dentro ogni domanda

## Gruppo 2: Contenuto

4. `app/workbook/templates/v1.yaml`: Fase I (Comprensione del business), inclusi i 9 fattori
   Go/No-Go e il piano di progetto
5. Fasi II e III (Comprensione e preparazione dei dati)
6. Fasi IV, V e VI (Sviluppo, valutazione, messa in esercizio)

## Gruppo 3: Loader

7. `app/workbook/loader.py`: `available_versions()`, `load_template(version)` con cache,
   `current_template()`; errore esplicito se il file non è valido
8. Validazione all'avvio in `create_app()` (il server non parte con un template rotto)

## Gruppo 4: API

9. `app/routers/template.py`: `GET /api/template` e `GET /api/template/{version}` (404 se assente)
10. Registrare il router in `app/main.py`
11. `make gen-api` per aggiornare i tipi del frontend

## Gruppo 4b: Go/No-Go di fase (dopo la prima revisione)

- Tipo `phase_gate` con `GateCriterion` (`key`, `label`, `return_to`)
- Gruppo `gate` in fondo a ogni fase nel YAML, con criteri parafrasati dai moduli 02–06 del corso

## Gruppo 5: Test

12. `tests/test_workbook_template.py` sul file reale: 6 fasi numerate 1–6, chiavi uniche,
    9 domande `go_no_go` (3 per gruppo), una `multi_choice` con 7 opzioni, ogni task con
    `guidance` non vuota, ogni domanda con `prompt` e `help` non vuoti
13. Test dei validatori su template costruiti ad hoc: chiave duplicata, prefisso errato,
    `options` mancanti, campo sconosciuto
14. Test dei Go/No-Go di fase: un gate per fase come ultima domanda, `return_to` solo verso fasi
    precedenti, nessun criterio nella Fase I; il validatore rifiuta le violazioni
15. `tests/test_template_api.py`: 200 su `/api/template`, 200 su `/api/template/1`, 404 su
    `/api/template/99`
