# Fase 17: Logo personale nel PDF e invito a sostenere un'ODV — Validazione

## Automatica

- Backend: `uv run pytest`, `uv run ruff check .`, `uv run ruff format --check .`,
  `uv run mypy app tests` passano.
- Frontend: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` passano.
- `make e2e` passa.
- Verifiche specifiche:
  - un PNG, un JPEG e un SVG sicuro sono accettati; un file oltre 1 MB, un tipo diverso e un SVG
    con script o riferimenti esterni sono rifiutati con un messaggio in italiano;
  - il PDF di chi ha un logo personale contiene quel logo, non quello del sito;
  - il PDF di chi non ha un logo contiene il logo del sito (come oggi);
  - lo stesso progetto scaricato da proprietario e collaboratore porta il logo di ciascuno;
  - il PDF della pagina condivisa porta sempre il logo del sito;
  - il colore del PDF è sempre quello del sito;
  - `GET /api/site` restituisce l'invito solo se acceso, con testo e link; un link non `https`
    è rifiutato in Amministrazione.

## Manuale

1. Profilo: carico un logo, vedo l'anteprima; scarico il PDF di un'iterazione e il logo è il mio.
2. Rimuovo il logo: il PDF torna con il logo del sito.
3. Invito un collaboratore con un altro logo: ognuno scarica il PDF con il proprio.
4. Apro la pagina condivisa e ne scarico il PDF: logo del sito, in pagina e nel PDF.
5. Amministrazione: accendo l'invito con il testo proposto e il link dell'ODV; nel profilo lo
   vedo sotto la scheda del logo; il link apre la pagina contributi in una nuova scheda.
6. Spengo l'invito o svuoto il testo: nel profilo non compare nulla.
7. Home, piè di pagina, pagina condivisa e PDF: nessun invito alla donazione.
8. Cancello l'account di prova: il logo sparisce con lui.

## Sicurezza

- Gli endpoint del logo personale richiedono l'utente e agiscono solo sul suo account; nessun ID
  utente nell'URL.
- Il logo personale si serve con le stesse intestazioni del logo del sito (CSP, `nosniff`).
- Il link dell'invito si apre con `noopener noreferrer`; l'app non registra click né donazioni.
- La pagina condivisa non legge il logo di nessun utente.

## Contenuti

- Nessun testo del workbook PMI coinvolto.
- L'invito dice che la donazione è spontanea e che chi ha creato l'app presiede l'associazione.

## Definition of done

Tutte le verifiche automatiche e manuali passano, privacy policy e roadmap aggiornate, e
l'utente approva prima del commit e del rilascio.
