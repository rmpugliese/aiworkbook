# Requirements: Fase 11 — Campi in Markdown

## Scope

Le risposte del workbook (testo, note, motivazioni dei Go/No-Go e delle fasi) e la user story
diventano **Markdown**: elenchi, tabelle, grassetto, corsivo, link.

- **Lettura**: un campo compilato si mostra già impaginato. Un clic (o Invio) lo apre in modifica.
- **Scrittura**: area di testo con una barra (grassetto, corsivo, elenco puntato, elenco
  numerato, tabella) e una breve guida; uscendo dal campo torna l'impaginazione.
- **Ritorni a capo**: un singolo a capo resta un a capo, come nei testi scritti finora.
- **PDF e pagina condivisa**: stesso Markdown impaginato, tabelle comprese, contenute nella
  larghezza della pagina A4.
- **Assistente AI**: risponde in Markdown semplice (elenchi, tabelle quando servono, grassetto con
  misura, niente titoli); la proposta si vede impaginata e si applica così com'è. Sparisce la
  ripulitura del Markdown introdotta nella Fase 7.

## Decisions

- Formato salvato: testo Markdown nello stesso campo. Nessuna migrazione: il testo semplice
  esistente è Markdown valido e appare come prima.
- Niente HTML: nel frontend `react-markdown` non interpreta HTML; nel backend `markdown-it-py`
  con `html` disattivato. Link `javascript:` scartati da entrambi.
- Dipendenze approvate dall'utente: `react-markdown`, `remark-gfm` (frontend), `markdown-it-py`
  (backend). I ritorni a capo singoli si ottengono senza ulteriori librerie.
- Editor visuale (TipTap) scartato: più dipendenze, conversione Markdown imperfetta.

## Context

- Campi: `workbook/QuestionField.tsx`, `workbook/PhaseGateField.tsx`, la user story in
  `pages/IterationPage.tsx`; proposta in `workbook/AssistantPanel.tsx`.
- Report: `app/export/templates/report.html.j2` e `report.css`; prompt in `app/ai/prompts.py`.
- Fuori scope: descrizione del progetto (resta testo semplice), immagini nel Markdown.
