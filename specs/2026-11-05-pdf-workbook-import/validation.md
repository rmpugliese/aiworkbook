# Fase 13: Import da workbook PDF compilabile — Verifica

## Automatica

- `uv run pytest`, `uv run ruff check .`, `uv run mypy app` (backend) e `npm test`,
  `npm run typecheck`, `npm run lint` (frontend) passano.
- Ogni chiave della tabella esiste nel template v1 con il tipo atteso; nessun campo PDF compare due
  volte.
- Un modulo con tutti i campi e alcuni testi crea un progetto dell'utente con le risposte giuste;
  i due campi delle prestazioni del modello diventano una sola risposta.
- Go/No-Go: una casella spuntata → esito e note; due caselle → nessun esito, note conservate.
- Pattern AI: "Recognition" e "analisi predittiva" nel testo → `recognition` e `predictive`.
- Campi mancanti rispetto al modulo atteso → 422 "PDF non riconosciuto", nessun progetto creato.
- Modulo riconosciuto ma vuoto → 422, nessun progetto creato.
- Richiesta non autenticata → 401; troppi campi o testi troppo lunghi → 422.
- `readFields` legge testi e caselle da un PDF generato nel test.

## Manuale

1. Pagina Progetti → "Importa da workbook PDF" → scelgo il workbook compilato in parte: il nome si
   propone dal file, aggiungo il cliente, confermo.
2. Si apre il progetto con "Importate N risposte"; le risposte sono nelle domande giuste,
   formattate con gli a capo.
3. Un PDF qualsiasi (non il workbook) → messaggio "PDF non riconosciuto", nessun progetto.
4. Il workbook vuoto → messaggio "nessun campo compilato".
5. Nella scheda Rete del browser la richiesta contiene solo i campi, non il PDF.

## Sicurezza

- Il progetto appartiene a chi importa; nessun dato di altri utenti è coinvolto.
- Il PDF non viene caricato né salvato; il server riceve solo testi con limiti di dimensione.

## Contenuti

- Nessun testo del workbook PMI nel codice, nella tabella o nei test.

## Definizione di fatto

Verifica automatica e manuale superate, roadmap aggiornata, commit con l'approvazione dell'utente.
