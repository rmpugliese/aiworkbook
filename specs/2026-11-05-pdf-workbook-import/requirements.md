# Fase 13: Import da workbook PDF compilabile — Requisiti

## Scope

Chi ha già compilato (anche in parte) il workbook PDF compilabile può creare un **progetto
nuovo** con l'iterazione 1 già riempita, senza ricopiare le risposte.

Incluso:

- pulsante "Importa da workbook PDF" nella pagina Progetti, con un modulo: file PDF, nome del
  progetto (obbligatorio, proposto dal nome del file) e cliente (facoltativo);
- lettura dei campi del modulo **nel browser** con `pdf-lib`: il PDF (circa 64 MB) non lascia mai
  il computer dell'utente; al server arrivano solo i valori dei campi;
- riconoscimento del modulo: se il PDF non ha campi compilabili o non è il workbook atteso, un
  messaggio chiaro e nessun progetto creato;
- import diretto, senza anteprima: si crea il progetto e si apre, con un riepilogo
  ("Importate N risposte dal workbook PDF");
- corrispondenze campo → domanda:

| Nel PDF | Nell'app |
|---|---|
| 63 campi di testo | 62 domande `text` e `multi_choice` (le prestazioni del modello occupano due campi, uniti in una risposta) |
| 9 gruppi Go/No-Go: 3 caselle (GO, MAYBE, NO-GO) e 3 campi note ciascuno | 9 domande `go_no_go`: la casella spuntata dà l'esito, le note diventano il testo |
| — | restano vuote: "altri vincoli", piano di progetto, strumenti iniziali e le 6 decisioni di fine fase |

- pattern AI: il testo del campo va nelle note della domanda e i pattern citati per nome
  (italiano o inglese) vengono spuntati.

Escluso:

- import in un'iterazione esistente;
- PDF appiattiti, stampati o scansionati (servirebbe l'AI: eventuale funzione a pagamento);
- altre versioni del modulo (si aggiungono con una nuova tabella).

## Decisioni

- **Lettura nel browser con `pdf-lib`** (approvata al posto di `pypdf`): il file è troppo grande
  per un upload comodo (limite del proxy, memoria del VPS) e così non viene mai trasmesso né
  salvato. `pdf-lib` si carica solo quando si apre l'import (import dinamico).
- **La tabella delle corrispondenze sta nel backend** (`app/workbook/pdf_form.py`): il browser
  invia tutti i campi del modulo (`nome → testo` o `nome → true/false`), il server riconosce il
  modulo, applica la tabella e crea il progetto in una transazione unica. Così la logica è testata
  con pytest senza PDF.
- **Riconoscimento**: il modulo è quello atteso se contiene tutti i nomi di campo della tabella.
- **Go/No-Go**: se è spuntata esattamente una casella, quello è l'esito; altrimenti nessun esito.
  Le note non vuote delle tre colonne si uniscono, nell'ordine GO, MAYBE, NO-GO.
- **Testi**: a capo normalizzati (`\r` → `\n`), spazi ai bordi tolti, campi vuoti ignorati.
- **Niente AI**: l'import non usa l'assistente e non marca l'iterazione come "redatta con
  supporto AI".
- **Gratuito**: è un modo per entrare nell'app; nessun limite a pagamento.

## Contesto

- Politica sui contenuti (`specs/workbook-model.md`): la tabella contiene solo nomi di campo e
  chiavi delle domande, **nessun testo del workbook PMI**; i test usano testi inventati.
- Segue il modello dell'import da file JSON esistente (`POST /api/projects/import`): progetto
  nuovo, tutto o niente, errori 422 con messaggi in italiano.
- L'endpoint richiede l'utente (`CurrentUser`) e crea il progetto con `owner_id` dell'utente.
- Limiti di dimensione sulla richiesta JSON (numero di campi e lunghezza dei testi) per evitare
  abusi.
