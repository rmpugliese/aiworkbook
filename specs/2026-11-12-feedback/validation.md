# Fase 19: Suggerimenti degli utenti — Validazione

## Automatica

- Backend: `uv run pytest`, `uv run ruff check .`, `uv run mypy app` passano.
- Frontend: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` passano.
- Test: email al contatto con Reply-To dell'utente; 401 senza accesso; 422 per tipo o testo non
  validi; 503 senza indirizzo; 429 al sesto invio in un'ora.

## Manuale

1. Menu utente → «Suggerisci un'idea»: invio, ringraziamento; in sviluppo l'email compare nel log
   del backend con «rispondi a» corretto.
2. Link nel piè di pagina su schermo largo; su telefono nessuno scorrimento orizzontale.
3. Senza indirizzo di contatto la voce non compare.
4. Home in finestra anonima: l'indirizzo di contatto è leggibile.

## Sicurezza

- Solo utenti con accesso; CSRF come le altre richieste; limite per utente.
- Nessun dato dell'utente nelle intestazioni dell'email oltre a «Reply-To» (email già validata).
- Il testo non viene salvato né scritto nei log.

## Definition of done

Verifiche passate, informativa aggiornata, approvazione dell'utente prima di commit e rilascio.
