# Requirements: Fase 2 — Progetti e iterazioni

## Scope

Gestire più progetti e, per ciascuno, le sue iterazioni (una "copia del workbook" per
iterazione). L'app è in modalità locale a utente singolo: niente login, niente `owner_id`, che
arriveranno nella Fase 5.

### Dati

| Entità | Campo | Note |
|---|---|---|
| Progetto | `name` | obbligatorio, 1–200 caratteri, spazi iniziali e finali rimossi |
| | `client_name` | facoltativo, fino a 200 caratteri (azienda cliente) |
| | `description` | facoltativo, testo libero |
| | `archived_at` | valorizzato quando il progetto è archiviato |
| | `created_at`, `updated_at` | automatici |
| Iterazione | `number` | progressivo per progetto (1, 2, 3…), assegnato dal server |
| | `title` | obbligatorio, 1–200 caratteri |
| | `user_story` | facoltativo: la user story di riferimento dell'iterazione |
| | `template_version` | versione del template corrente al momento della creazione |
| | `status` | `draft` (default) o `completed` |
| | `created_at`, `updated_at` | automatici |
| Risposta | `question_key`, `text`, `verdict`, `choices`, `return_to_phase` | solo la tabella: le API di compilazione arrivano nella Fase 3 |

### Comportamento

- **Creazione del progetto**: crea anche l'iterazione 1 (titolo di default "Iterazione 1",
  modificabile).
- **Nuova iterazione**: l'utente sceglie se partire **vuota** oppure **copiare** le risposte di
  un'iterazione precedente dello stesso progetto. La copia duplica tutte le risposte e, se l'utente
  non ne indica una nuova, anche la user story.
- **Archiviazione**: "Archivia" nasconde il progetto dall'elenco principale, "Ripristina" lo
  riporta tra gli attivi. I progetti archiviati si vedono attivando un filtro.
- **Eliminazione definitiva**: possibile solo per un progetto archiviato, con doppia conferma:
  l'utente deve scrivere il nome esatto del progetto. Elimina anche iterazioni e risposte.
- **Ordinamento**: progetti per ultima modifica (i più recenti in alto), iterazioni per numero.

### API

| Metodo | Percorso | Note |
|---|---|---|
| `GET` | `/api/projects?archived=false` | elenco, con numero di iterazioni |
| `POST` | `/api/projects` | crea progetto e iterazione 1 |
| `GET` | `/api/projects/{id}` | dettaglio con le iterazioni |
| `PATCH` | `/api/projects/{id}` | modifica nome, cliente, descrizione |
| `POST` | `/api/projects/{id}/archive` · `/unarchive` | archivia o ripristina |
| `DELETE` | `/api/projects/{id}` | corpo `{ "confirm_name": "…" }`; 409 se non archiviato, 422 se il nome non coincide |
| `POST` | `/api/projects/{id}/iterations` | `{ title, user_story?, copy_from_iteration_id? }` |
| `GET` · `PATCH` | `/api/projects/{id}/iterations/{iteration_id}` | dettaglio, modifica titolo, user story, stato |

Errori: 404 per progetto o iterazione inesistenti (o iterazione di un altro progetto), 422 per
dati non validi.

### Interfaccia

- **Home `/`: elenco dei progetti** (schede con nome, cliente, numero di iterazioni, ultima
  modifica), pulsante "Nuovo progetto", interruttore "Mostra archiviati".
- **`/projects/:id`: dettaglio del progetto**: dati modificabili, elenco delle iterazioni,
  pulsante "Nuova iterazione" (con la scelta vuota o copia), azioni Archivia, Ripristina ed
  Elimina definitivamente.
- **`/projects/:id/iterations/:iterationId`**: per ora solo intestazione e user story modificabile,
  con un avviso che la compilazione arriverà nella prossima fase.
- Lo stato del backend passa dalla home a un piccolo indicatore nell'header.

### Escluso

- Compilazione delle risposte (Fase 3), Go/No-Go (Fase 4), account e proprietà (Fase 5)
- Eliminazione di singole iterazioni
- Ricerca e paginazione dei progetti (non servono con pochi progetti)

## Decisions

- **Campi essenziali**: nome, cliente e descrizione; niente anagrafica estesa per ora.
- **Iterazione nuova: vuota o copiata**, a scelta dell'utente; la prima nasce col progetto.
- **Archivia + elimina**: l'eliminazione definitiva richiede prima l'archiviazione e la conferma
  scrivendo il nome, verificata anche dal server (non solo dall'interfaccia).
- **Tabella `answers` anticipata** a questa fase, perché la copia di un'iterazione possa copiare
  davvero le risposte ed essere testata; le API di lettura e scrittura restano nella Fase 3.
- **Eliminazione a cascata**: chiavi esterne con `ON DELETE CASCADE`; su SQLite si attiva
  `PRAGMA foreign_keys=ON` a ogni connessione.
- **Struttura del codice**: modelli in `app/models/`, schemi in `app/schemas/`, logica in
  `app/services/` (senza dipendenze da FastAPI), router sottili in `app/routers/`, come previsto
  da `specs/tech-stack.md`.
- **Nessuna nuova dipendenza**: i form del frontend usano i componenti Mantine già installati.

## Context

- Modalità locale a utente singolo fino alla Fase 5: le funzioni di servizio ricevono già una
  sessione DB esplicita, così aggiungere il filtro per proprietario sarà semplice.
- Interfaccia in italiano, date nel formato italiano.
- Seguire i pattern della Fase 0 (router, test con DB SQLite in memoria, `renderRoutes` nei test
  del frontend).
