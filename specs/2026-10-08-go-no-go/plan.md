# Plan: Fase 4 — Valutazione Go/No-Go

## Gruppo 1: Backend

1. `app/services/answers.py`: `return_to_phase` solo con verdetto MAYBE o NO-GO
2. Test della nuova regola

## Gruppo 2: Regole

3. `src/workbook/goNoGo.ts`: `phaseOneSuggestion`, `gateSuggestion` (verdetto e fase di ritorno),
   `phaseStatus`, `factorMatrix`
4. `src/workbook/goNoGo.test.ts`: tutti i casi delle regole

## Gruppo 3: Componenti

5. `useAnswerDraft`: bozza, aggiornamento e autosave condivisi dai campi
6. `VerdictControl` e colori condivisi dei verdetti
7. `PhaseGateField`: checklist, suggerimento, verdetto, fase di ritorno, motivazione, avviso di
   scostamento; per la Fase I matrice 3×3 ed esito suggerito
8. `GoNoGoSummary`: riepilogo dell'iterazione
9. `WorkbookNav`: voce "Riepilogo Go/No-Go" e stato di ogni fase
10. `TaskView` / `IterationPage`: passaggio delle risposte ai Go/No-Go e vista `summary`

## Gruppo 4: Test

11. Test dei componenti: suggerimento e fase di ritorno aggiornati spuntando i criteri, avviso di
    scostamento, fase di ritorno azzerata con GO, matrice e riepilogo
12. Estendere il test end-to-end: un Go/No-Go di fase con checklist e fase di ritorno
