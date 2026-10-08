# Requirements: Fase 5 — Esportazione PDF

## Scope

Dalla pagina di un'iterazione si scarica un PDF che raccoglie tutto il lavoro, pronto da
consegnare al cliente.

### Contenuto del PDF (report completo)

| Sezione | Contenuto |
|---|---|
| Copertina | Nome dell'app, titolo "Workbook di progetto AI", progetto, cliente, iterazione (numero e titolo), stato, data di generazione, versione del template |
| Indice | Le sezioni seguenti con il numero di pagina |
| User story | La user story dell'iterazione (o "Non indicata") |
| Riepilogo Go/No-Go | Matrice 3×3 dei 9 fattori con il verdetto; esito calcolato e deciso della Fase I; tabella delle 6 fasi con esito, fase di ritorno e motivazione |
| Fasi I–VI | Per ogni fase: titolo e sintesi; per ogni task il titolo e le sue domande con la risposta |

Le **guide dei task** e i **testi d'aiuto** non sono inclusi.

### Come si presentano le risposte

| Tipo | Nel PDF |
|---|---|
| `text` | Il testo, con gli a capo rispettati |
| `multi_choice` | Le opzioni scelte in elenco, poi le note |
| `go_no_go` | Il verdetto (etichetta colorata) e la motivazione |
| `phase_gate` | I criteri soddisfatti e non soddisfatti, il verdetto, la fase di ritorno, la motivazione |
| Senza risposta | "Non compilato", in grigio |

### Impaginazione

- A4, intestazione con progetto e iterazione, piè di pagina con "Pagina N di M" e la dicitura
  "Compatibile con la metodologia CPMAI".
- Ogni fase inizia su una nuova pagina; una domanda non si spezza tra due pagine se è breve.
- Colori dei verdetti come nell'app (GO verde, MAYBE giallo, NO-GO rosso), leggibili anche in
  bianco e nero (l'etichetta è sempre scritta).

### API e interfaccia

- `GET /api/projects/{id}/iterations/{iteration_id}/export.pdf` → `application/pdf`, con
  `Content-Disposition: attachment` e un nome file leggibile, per esempio
  `Churn - Iterazione 1 - 2026-10-08.pdf` (caratteri non validi rimossi).
- Pulsante "Scarica PDF" nella pagina dell'iterazione (e nella riga dell'iterazione nel
  dettaglio del progetto).
- 404 per iterazione inesistente o di un altro progetto.

### Escluso

- Export DOCX (rinviato)
- Personalizzazione del report (logo del consulente, scelta delle sezioni)
- Generazione asincrona: il PDF si genera al momento (pochi secondi al massimo)

## Decisions

- **Report completo senza guide**: è un documento per il cliente, non un manuale.
- **WeasyPrint** sul server: HTML + CSS di stampa → PDF. Nuove dipendenze `weasyprint` (Python)
  e, a livello di sistema, Pango. In locale su Apple Silicon serve Pango arm64 (Homebrew in
  `/opt/homebrew`); il `Makefile` imposta `DYLD_FALLBACK_LIBRARY_PATH` per trovarlo. In
  produzione (Linux) si installa con il gestore di pacchetti.
- **Template HTML con Jinja2** (già incluso in FastAPI), con autoescape attivo: le risposte degli
  utenti non possono iniettare HTML.
- **"Non compilato"** per le domande senza risposta.
- **Le regole del Go/No-Go** (esito della Fase I) vengono calcolate anche nel backend per il
  report, con gli stessi test di comportamento del frontend.

## Context

- I dati arrivano dai servizi esistenti (progetto, iterazione, risposte, template della versione
  dell'iterazione).
- Font: si usano i font di sistema senza grazie (nessun font scaricato da internet).
- Testi in italiano, date nel formato italiano.
