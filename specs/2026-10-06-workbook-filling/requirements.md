# Requirements: Fase 3 — Compilazione del workbook

## Scope

L'utente apre un'iterazione e compila il workbook task per task; ogni risposta si salva da sola.

### Navigazione

- **Barra laterale** con le 6 fasi e, sotto ciascuna, gruppi e task. Per ogni fase c'è
  l'avanzamento ("12/41"), per ogni task un segno di completamento.
- **Area principale**: un task per volta, con titolo, guida e domande. In fondo i pulsanti
  "Precedente" e "Successivo", che seguono l'ordine del workbook.
- Il task aperto si legge dall'URL (`?task=<fase>.<gruppo>.<task>`), così si può ricaricare la
  pagina o condividere il link senza perdere la posizione. Senza parametro si apre il primo task.
- La **user story** dell'iterazione resta in cima alla pagina, in un pannello richiudibile.

### Domande

| Tipo | Interfaccia in questa fase |
|---|---|
| `text` | Area di testo che cresce con il contenuto, con il testo d'aiuto sotto la domanda |
| `multi_choice` | Caselle di spunta per le opzioni (i 7 pattern) più un campo di note |
| `go_no_go` | Scelta GO / MAYBE / NO-GO più la motivazione |
| `phase_gate` | Verdetto GO / MAYBE / NO-GO più la motivazione; i criteri sono mostrati come elenco informativo |

Una domanda conta come **compilata** se ha testo non vuoto, un verdetto o almeno una scelta.

### Salvataggio automatico

- Ogni domanda si salva da sola circa 1 secondo dopo l'ultima modifica.
- Accanto a ogni domanda c'è lo stato: "Salvato", "Salvataggio…" oppure "Errore nel salvataggio"
  (con il pulsante "Riprova").
- Se si cambia task con modifiche in sospeso, si salvano subito.
- Se si chiude o ricarica la pagina con modifiche non salvate, il browser chiede conferma.

### API

| Metodo | Percorso | Note |
|---|---|---|
| `GET` | `/api/projects/{id}/iterations/{iteration_id}/answers` | tutte le risposte dell'iterazione |
| `PUT` | `/api/projects/{id}/iterations/{iteration_id}/answers/{question_key}` | crea o aggiorna una risposta |

Il `PUT` riceve `{ text, verdict, choices, return_to_phase }` e lo valida rispetto alla domanda
del template (nella versione dell'iterazione):

- chiave inesistente nel template → 404;
- campi non ammessi dal tipo di domanda → 422 (es. `verdict` su una domanda `text`);
- `choices` solo tra le opzioni (`multi_choice`) o i criteri (`phase_gate`) della domanda;
- `return_to_phase` solo per `phase_gate`, solo verso fasi precedenti e mai nella Fase I;
- se tutti i campi sono vuoti, la risposta viene eliminata (la domanda torna "non compilata").

Il salvataggio aggiorna anche la data di ultima modifica dell'iterazione e del progetto.

### Escluso (Fase 4)

- Checklist dei criteri dei Go/No-Go di fase, fase di ritorno suggerita, esito della Fase I
  calcolato dai 9 fattori, riepilogo a matrice e stato delle fasi nella navigazione
- Storico delle revisioni delle risposte

## Decisions

- **Barra laterale + un task per pagina**: la Fase I ha 41 domande, troppe per una sola pagina.
- **Autosave per domanda**, con stato visibile e salvataggio forzato al cambio di task; nessun
  pulsante "Salva".
- **Go/No-Go già compilabili nella forma base** (verdetto e motivazione): i dati restano
  compatibili con l'interfaccia completa della Fase 4, che aggiungerà `choices` e
  `return_to_phase` per i Go/No-Go di fase.
- **Validazione sul server** rispetto al template: l'interfaccia non può salvare dati incoerenti
  con la domanda.
- **Playwright** (già previsto in `specs/tech-stack.md`) per un test end-to-end, solo con
  Chromium: compilare, ricaricare la pagina, ritrovare i dati.

## Context

- Modalità locale a utente singolo (fino alla Fase 5).
- Il template è servito da `GET /api/template/{version}` e non cambia: in cache senza scadenza.
- Seguire i pattern della Fase 2: servizi senza dipendenze da FastAPI, router sottili, hook di
  TanStack Query in `src/api/`, `mockApi` nei test del frontend.
