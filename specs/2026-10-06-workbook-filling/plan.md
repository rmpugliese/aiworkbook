# Plan: Fase 3 — Compilazione del workbook

## Gruppo 1: API delle risposte

1. `app/workbook/loader.py`: funzione per trovare una domanda per chiave in una versione del
   template (con il numero della sua fase)
2. `app/schemas/answers.py`: `AnswerIn`, `AnswerOut`
3. `app/services/answers.py`: elenco, upsert con validazione per tipo di domanda, eliminazione
   della risposta vuota, aggiornamento di `updated_at` di iterazione e progetto
4. Router: `GET …/answers` e `PUT …/answers/{question_key}`; `make gen-api`

## Gruppo 2: Test backend

5. `tests/test_answers_api.py`: salvataggio e lettura per ogni tipo di domanda, 404 per chiave
   sconosciuta e iterazione di un altro progetto, 422 per campi non ammessi, scelte non valide e
   fase di ritorno non valida, eliminazione della risposta vuota, aggiornamento delle date

## Gruppo 3: Dati nel frontend

6. `src/api/template.ts`: `useTemplate(version)` con cache senza scadenza
7. `src/api/answers.ts`: `useAnswers`, `useSaveAnswer` (aggiorna la cache senza ricaricare)
8. `src/workbook/`: funzioni pure per l'elenco ordinato dei task, la ricerca per percorso, il
   calcolo di "compilata" e dell'avanzamento per fase, con test unitari

## Gruppo 4: Interfaccia

9. `useAutosave`: debounce di circa 1 s, stato, nuovo tentativo, salvataggio immediato allo
   smontaggio, avviso `beforeunload`
10. Componenti delle domande: `TextQuestionField`, `MultiChoiceField`, `GoNoGoField`,
    `PhaseGateField` (base)
11. `WorkbookNav`: barra laterale con fasi, gruppi, task, avanzamento e task attivo
12. `TaskView`: guida, domande, Precedente/Successivo
13. `IterationPage`: intestazione, user story richiudibile, layout a due colonne, task dall'URL

## Gruppo 5: Test frontend ed end-to-end

14. Test dei componenti: autosave (debounce, stato, errore e nuovo tentativo), navigazione tra
    task, avanzamento
15. Playwright con Chromium: `e2e/fill-workbook.spec.ts` crea un progetto, compila una domanda di
    testo, un pattern di AI e un Go/No-Go, ricarica la pagina e ritrova i dati
16. Target `make e2e` e comandi nel README
