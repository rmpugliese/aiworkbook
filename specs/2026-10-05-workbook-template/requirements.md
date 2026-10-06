# Requirements: Fase 1 — Definizione strutturata del workbook

## Scope

Rappresentare l'intera struttura del workbook CPMAI in un file YAML versionato, con testi
parafrasati in italiano, validarlo al caricamento e servirlo via API. In questa fase non c'è
ancora nessuna risposta dell'utente né interfaccia di compilazione.

### Struttura del template

| Livello | Campi |
|---|---|
| Template | `version` (intero), `title` |
| Fase | `key`, `number` (1–6), `title`, `summary` (1–2 frasi), `task_groups` |
| Gruppo di task | `key`, `title`, `summary` (opzionale), `tasks` |
| Task | `key`, `title`, `guidance` (2–4 frasi parafrasate), `questions` (anche vuota) |
| Domanda | `key`, `type`, `prompt`, `help`, `options` (solo `multi_choice`) |

### Tipi di domanda

| Tipo | Note |
|---|---|
| `text` | Risposta aperta |
| `go_no_go` | Verdetto GO / MAYBE / NO-GO più motivazione; ha anche `factor_group` (`business`, `data`, `execution`) |
| `multi_choice` | Scelta multipla con `options` (`key` + `label`) più note libere |
| `phase_gate` | Go/No-Go di fine fase: `criteria` (`key`, `label`, `return_to` opzionale), verdetto, fase a cui tornare, motivazione |

### Chiavi

- Formato: `p<fase>.<gruppo>.<task>.<domanda>` in snake_case inglese, per esempio
  `p1.objectives.business_objectives.problem`.
- Uniche in tutto il template. Si possono aggiungere chiavi nuove, ma le esistenti non si
  rinominano mai dopo il rilascio.

### API

- `GET /api/template` restituisce il template corrente (versione più alta disponibile).
- `GET /api/template/{version}` restituisce una versione specifica; 404 se non esiste.
- Le risposte sono pubbliche (nessuna autenticazione): il template non contiene dati utente.

### Escluso

- Risposte, progetti, iterazioni (Fase 3 e 4)
- Interfaccia di consultazione del template nel frontend (arriva con la compilazione in Fase 4)
- Soglie numeriche strutturate per le metriche del modello

## Decisions

- **Guida + aiuto**: ogni task ha una `guidance` parafrasata di 2–4 frasi, ogni domanda un `help`
  che suggerisce cosa considerare. Questi testi faranno anche da contesto all'assistente AI in
  Fase 8.
- **Metriche in testo libero**: la domanda sulle prestazioni del modello resta `text`, come nel
  PDF. Le soglie strutturate potranno arrivare in un template v2.
- **Go/No-Go di fine fase** (aggiunto dopo la prima revisione): il workbook PDF ha un Go/No-Go
  solo nella Fase I, ma i moduli del corso chiudono ogni fase con un Go/No-Go e con i casi in cui
  tornare a una fase precedente. Ogni fase termina quindi con un gruppo `gate` che contiene una
  domanda `phase_gate`:
  - Fasi II–VI: checklist di criteri parafrasati dal corso, ognuno con la fase a cui tornare se
    non è soddisfatto (oppure nessuna, se il problema si risolve nella fase stessa);
  - Fase I: nessun criterio, l'esito deriva dai 9 fattori ed è confermato dall'utente.
  Il validatore richiede un solo gate per fase, come ultima domanda, con `return_to` solo verso
  fasi precedenti e nessun criterio nella Fase I.
- **Il report finale** (Fase VI) è un task con `questions: []`: compare nella navigazione, ma il
  suo contenuto è il documento generato in Fase 6.
- **Template come file del pacchetto**: `backend/app/workbook/templates/v1.yaml`, letto una sola
  volta e tenuto in cache in memoria; i test validano il file reale.
- **Nuova dipendenza `pyyaml`** (con `types-PyYAML` per mypy): già prevista da
  `specs/tech-stack.md` ("definizione strutturata del workbook (YAML)").
- **Validazione rigorosa**: modelli Pydantic con `extra="forbid"`, più controlli trasversali
  (chiavi uniche, prefisso delle chiavi coerente con la gerarchia, numeri di fase 1–6 in ordine,
  `options` presenti solo e sempre per `multi_choice`, `factor_group` presente solo e sempre per
  `go_no_go`). Un template non valido impedisce l'avvio dell'app.

## Context

- **Politica sui contenuti** (`specs/workbook-model.md`): niente frasi copiate o tradotte alla
  lettera dal PDF. Si mantengono l'ordine e il significato di ogni domanda, ma con parole nostre.
  I nomi generici delle attività e dei 7 pattern di AI sono ammessi.
- **Revisione umana**: il fondatore rivede il YAML fase per fase prima del merge.
- L'inventario delle domande è in `specs/workbook-model.md`; questa fase lo rende definitivo.
- Seguire il modello dei router della Fase 0 (`app/routers/health.py`) e la configurazione di
  qualità esistente (ruff, mypy strict).
