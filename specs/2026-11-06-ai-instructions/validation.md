# Fase 16: Indicazioni aggiuntive per l'assistente AI — Validazione

## Automatica

- Backend: `uv run pytest` (SQLite e PostgreSQL), `uv run ruff check .`, `uv run mypy app`.
- Frontend: `npm test`, `npm run typecheck`, lint.
- Verifiche specifiche:
  - con indicazioni, il messaggio utente contiene la sezione delle indicazioni dopo il compito;
  - senza indicazioni (o con soli spazi) il messaggio è identico a quello di prima;
  - 1.001 caratteri → 422;
  - nessuna colonna o riga del log contiene il testo delle indicazioni;
  - il frontend invia `instructions` nel corpo della richiesta.

## Manuale

1. In un progetto con l'assistente attivo clicca "Assistente", scrivi nelle indicazioni "rispondi in 3 punti" e
   chiedi una bozza: la proposta segue l'indicazione.
2. Cambia azione ("Critica e domande") senza riscrivere: le indicazioni sono ancora lì.
3. Scrivi "rispondi in inglese": la risposta resta in italiano (regole di base).
4. Ricarica la pagina: il campo delle indicazioni è vuoto.
5. Da collaboratore: le indicazioni funzionano allo stesso modo.

## Sicurezza

- L'endpoint `assist` continua a richiedere l'utente e l'accesso al progetto (404 per gli
  estranei), il consenso del proprietario e il limite orario.
- Le indicazioni non si salvano e non finiscono nei log.

## Contenuti

- Nessun testo del workbook PMI aggiunto.

## Definizione di fatto

Tutti i controlli automatici passano, il percorso manuale funziona in locale, roadmap aggiornata.
