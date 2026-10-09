# Requirements: Fase 8 — Condivisione in sola lettura

## Scope

Il consulente condivide un'iterazione con il cliente tramite un link. Chi apre il link vede il
report dell'iterazione in una pagina web in sola lettura e può scaricare il PDF, senza account.

### Link di condivisione

Per ogni iterazione il proprietario può creare **più link**, uno per destinatario:

| Campo | Note |
|---|---|
| Etichetta | obbligatoria, fino a 120 caratteri, es. "Mario Rossi · ACME" |
| Scadenza | facoltativa: nessuna, 7, 30 o 90 giorni |
| Creato il | data di creazione |
| Ultimo accesso | data dell'ultima apertura e numero di aperture |
| Stato | attivo, scaduto, revocato |

- Il link ha la forma `https://<host>/s/<token>`; il token è casuale (32 byte, `secrets`), non
  indovinabile.
- Nel database si salva **solo l'hash SHA-256** del token, come per le sessioni: il link completo
  si vede e si copia **una sola volta**, alla creazione. Se lo si perde, se ne crea un altro.
- **Revoca**: un link revocato smette subito di funzionare e resta nell'elenco come "Revocato".
- Link revocati e scaduti si possono eliminare dall'elenco.

### Pagina pubblica `/s/<token>`

- Mostra il report dell'iterazione, con gli stessi contenuti del PDF: copertina, user story,
  riepilogo Go/No-Go, tutte le fasi con domande e risposte, "Non compilato" dove manca.
- Una barra in alto: nome del progetto, "Documento in sola lettura", data dell'ultimo
  aggiornamento e il pulsante **Scarica PDF** (`/s/<token>/pdf`).
- I contenuti sono **sempre aggiornati**: la pagina legge lo stato attuale dell'iterazione.
- Nessun campo modificabile, nessun JavaScript, nessun riferimento all'account del consulente
  (email, altri progetti, altre iterazioni).

### Quando il link non funziona

Risponde **404** con una pagina generica ("Link non valido o non più disponibile"), senza dire
perché, se il token:

- non esiste, è stato revocato o è scaduto;
- appartiene a un progetto **archiviato** (ripristinando il progetto il link torna a funzionare);
- appartiene a un progetto o un'iterazione eliminati (i link si cancellano con loro).

## Decisions

- **Report + PDF** (scelta dell'utente): la pagina riusa il modello del report e il template
  Jinja della Fase 5, con un foglio di stile per lo schermo. Una sola fonte per i contenuti: ciò
  che il cliente legge è ciò che scarica.
- **Pagina servita dal backend**, non dalla SPA: niente codice dell'app e niente sessione per i
  lettori, ed è facile applicare intestazioni restrittive. In sviluppo Vite inoltra `/s` al
  backend, come `/api`.
- **Più link con scadenza facoltativa** (scelta dell'utente): uno per destinatario, revocabili
  singolarmente; l'ultimo accesso aiuta a capire se il cliente ha aperto il documento.
- **Sempre aggiornati** (scelta dell'utente): niente fotografie dei contenuti.
- **Token solo come hash**: un database letto da altri non espone link funzionanti. Il prezzo è
  che il link si copia solo alla creazione.
- **Progetto archiviato = link sospesi**: archiviare segnala che il lavoro non è attivo.
- Intestazioni della pagina pubblica: `X-Robots-Tag: noindex, nofollow`,
  `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, una `Content-Security-Policy` che
  ammette solo lo stile inline, `X-Frame-Options: DENY`.
- Limite di richieste per indirizzo IP sulle pagine pubbliche (60 al minuto), contro i tentativi
  a tappeto; il PDF ha un limite più basso (10 al minuto) perché costa di più generarlo.

## Context

- Modelli e migrazioni come nelle fasi precedenti (`app/models/`, Alembic con `render_as_batch`).
- Servizi senza FastAPI in `app/services/`; gli endpoint del proprietario passano `owner_id` e
  restituiscono 404 per le risorse altrui.
- Rendering: `app/export/report.py` (modello) e `app/export/pdf.py` (`render_html`,
  `render_pdf`, `pdf_filename`).
- Rate limiting: `app/auth/rate_limit.py`.
- Frontend: Mantine, TanStack Query, tipi generati con `make gen-api`.
- `CLAUDE.md` va corretto: la condivisione è la Fase 8, non la 7.

### Fuori scope

- Password sui link, notifiche al consulente quando il cliente apre il link.
- Commenti del cliente.
- Condivisione di un intero progetto (più iterazioni) con un solo link.
- Servire la build del frontend dal backend in produzione (Fase 9).
