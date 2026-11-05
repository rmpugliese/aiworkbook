# Fase 13: Import da workbook PDF compilabile — Piano

## 1. Tabella delle corrispondenze (backend)

1. `app/workbook/pdf_form.py`: nomi dei campi di testo → chiave della domanda; per ogni fattore
   Go/No-Go le tre caselle e i tre campi note (colonne GO, MAYBE, NO-GO).
2. `map_fields(fields) -> list[AnswerIn-like]`: riconosce il modulo, normalizza i testi, unisce i
   campi della stessa domanda, ricava gli esiti Go/No-Go e i pattern AI citati.
3. Test unitari: tutte le chiavi esistono nel template v1 e hanno il tipo giusto; nessun campo è
   usato due volte.

## 2. Servizio e API

1. `services/pdf_import.py`: `import_workbook_fields(db, user, name, client_name, fields)` crea
   progetto e iterazione 1 con le risposte, tutto o niente; restituisce progetto e conteggio.
2. Schemi `WorkbookPdfImportIn` (nome, cliente, campi con limiti) e `WorkbookPdfImportOut`
   (progetto, risposte importate).
3. `POST /api/projects/import-workbook` con `CurrentUser`; 422 se il modulo non è riconosciuto o
   non c'è nulla da importare.
4. `make gen-api`.

## 3. Frontend

1. Dipendenza `pdf-lib` (approvata), caricata con import dinamico.
2. `src/pdfImport/readFields.ts`: legge tutti i campi (testo e caselle) dal file; errori chiari
   per PDF non leggibili, protetti o senza campi.
3. `api/projects.ts`: `useImportWorkbookPdf`.
4. `WorkbookPdfImportModal`: file, nome (proposto dal file), cliente; spiega che il PDF resta sul
   computer; stato di caricamento ed errori.
5. Pagina Progetti: pulsante "Importa da workbook PDF"; dopo l'import si apre il progetto con il
   riepilogo delle risposte importate.

## 4. Test

1. pytest: mappatura (testi, campi uniti, Go/No-Go con una o più caselle, pattern), modulo non
   riconosciuto, nessun campo compilato, limiti, endpoint (proprietario, tutto o niente).
2. Vitest: `readFields` su un PDF con modulo generato nel test con `pdf-lib`; modale (invio,
   errore).
3. Prova manuale con un workbook reale compilato in parte.

## 5. Chiusura

1. Roadmap: Fase 13 spuntata.
2. Lint, tipi, test backend e frontend.
