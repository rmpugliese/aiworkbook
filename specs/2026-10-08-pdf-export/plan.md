# Plan: Fase 5 — Esportazione PDF

## Gruppo 1: Ambiente

1. Dipendenza `weasyprint`; Pango arm64 in locale tramite Homebrew
2. `Makefile` e `playwright.config.ts`: `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` su macOS
3. README e `specs/tech-stack.md`: prerequisiti di sistema

## Gruppo 2: Modello del report

4. `app/export/report.py`: costruisce un modello del report (dataclass) da progetto, iterazione,
   template e risposte: sezioni, domande con risposta normalizzata, matrice dei fattori, esiti
   delle fasi
5. `app/workbook/go_no_go.py`: esito della Fase I calcolato dai 9 fattori (stessa regola del
   frontend)

## Gruppo 3: Rendering

6. `app/export/templates/report.html.j2` e `report.css`: copertina, indice con numeri di pagina
   (`target-counter`), riepilogo, fasi; intestazioni e piè di pagina con `@page`
7. `app/export/pdf.py`: `render_html(report)` e `render_pdf(report)`; nome del file

## Gruppo 4: API e interfaccia

8. Endpoint `GET …/export.pdf` nel router dei progetti
9. Pulsante "Scarica PDF" nella pagina dell'iterazione e nel dettaglio del progetto

## Gruppo 5: Test

10. Test del modello del report: risposte normalizzate per tipo, "Non compilato", matrice, esiti
11. Test dell'HTML: sezioni presenti, risposte e "Non compilato", escape dell'HTML degli utenti
12. Test dell'endpoint: 200 con `application/pdf`, intestazione `%PDF`, nome del file; testo
    estratto dal PDF con `pypdf` (dipendenza di sviluppo) contenente titoli e risposte; 404
13. Test del frontend: il pulsante punta all'URL di export
