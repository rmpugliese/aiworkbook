# Fase 15: Collaborazione tra consulenti — Verifica

## Automatica

- `uv run pytest`, `uv run ruff check .`, `uv run mypy app`, `npm test`, `npm run typecheck`,
  `npm run lint` passano; `make test-postgres` passa.
- Invito a un utente confermato: il progetto compare nel suo elenco come condiviso; email inviata.
- Invito a un indirizzo non iscritto: nessun accesso finché non si iscrive **e conferma**; dopo la
  conferma (anche con Google) il progetto compare.
- Limite: il sesto invito è rifiutato; doppione e invito a se stessi rifiutati.
- Collaboratore: legge e salva risposte, crea iterazioni, scarica il PDF, esporta il progetto,
  usa l'AI se attiva; riceve 404 su modifica/archivio/eliminazione del progetto, consenso AI,
  link pubblici e gestione membri; può lasciare il progetto.
- Utente non membro: 404 su tutto, come prima.
- Rimozione di un collaboratore: perde subito l'accesso.
- Risposte: `updated_by` è l'ultimo autore; conflitto → 409 con la versione attuale; stessa
  persona → nessun conflitto; senza `base_updated_at` → nessun controllo.
- Eliminazione dell'account del collaboratore: appartenenze rimosse, risposte senza autore.
- Frontend: badge "Condiviso da", scheda Collaboratori, pannello di conflitto.

## Manuale

1. Due account in locale: il proprietario invita il collega, che vede il progetto e compila.
2. Stessa risposta aperta in due browser: il secondo salvataggio mostra il conflitto.
3. Il collaboratore non vede Modifica, Archivia, Elimina, Condividi né la gestione dei membri.

## Sicurezza

- Nessun accesso con un invito non confermato; nessuna informazione su progetti altrui (404).
- I membri vedono nome ed email degli altri membri dello stesso progetto, non di altri.

## Definizione di fatto

Verifiche superate, testi legali aggiornati, roadmap, commit con l'approvazione dell'utente.
