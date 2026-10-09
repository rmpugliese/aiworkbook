# Plan: Fase 11 — Campi in Markdown

1. Dipendenze: `react-markdown`, `remark-gfm`, `markdown-it-py`
2. Backend: filtro Jinja `markdown` (HTML disattivato, tabelle, a capo singoli); template e CSS
   del report per risposte, motivazioni e user story; tabelle contenute nell'A4
3. Prompt dell'assistente: Markdown semplice ammesso, niente titoli
4. Frontend: `Markdown` (resa sicura, a capo singoli), `MarkdownField` (lettura impaginata, clic per
   modificare, barra di formattazione, guida); usato in domande, porte di fase e user story
5. Proposta dell'assistente impaginata; rimozione di `plainText`
6. Test: filtro (tabelle, a capo, HTML e `javascript:` neutralizzati), report e pagina condivisa
   con tabelle, PDF; frontend: lettura/modifica, barra (grassetto, elenco, tabella), proposta
   impaginata; e2e aggiornati
