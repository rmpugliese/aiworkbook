# Requirements: Fase 9 — Marchio del consulente ed estetica

## Scope

### Marchio del consulente

Ogni utente, nella nuova pagina **Profilo**, imposta il proprio marchio:

| Campo | Note |
|---|---|
| Nome visualizzato | già nel modello, ora modificabile |
| Logo | PNG, JPEG o SVG, fino a 1 MB; anteprima; "Rimuovi" |
| Colore principale | esadecimale `#RRGGBB`; anteprima su pulsante, barra e titolo |

Il marchio è **del consulente proprietario del progetto** e compare:

- nell'**intestazione dell'app** quando è lui a usarla (al posto del nome dell'app);
- sulla **copertina del PDF** e nei titoli, con il colore principale;
- nella **pagina condivisa** con il cliente: logo e barra del colore principale.

Senza logo e colore restano il nome dell'app e la palette predefinita.

### Estetica: professionale e sobria

- Font **Inter** servito dall'app (`@fontsource-variable/inter`), niente chiamate a servizi esterni.
- Icone **Tabler** (`@tabler/icons-react`) nei punti di navigazione e azione.
- Palette ardesia/blu, sfondo grigio chiarissimo, card bianche con bordo leggero, raggi e ombre
  coerenti; il colore principale del consulente diventa il colore primario del tema.
- Pagine riviste: intestazione (logo, menu utente con avatar), dashboard dei progetti (card con
  cliente, iterazioni, ultima modifica, stato vuoto con invito all'azione), pagina del progetto,
  pagina dell'iterazione (navigazione per fasi più leggibile), pagine di accesso (card centrata).
- L'indicatore "Backend online" compare solo quando il backend **non** risponde.

## Decisions

- **Marchio per consulente** (scelta dell'utente): adatto al rilascio pubblico, dove ogni
  consulente ha i propri documenti. Nessun logo globale dell'installazione per ora.
- **Logo + colore** (scelta dell'utente).
- **Logo nel database** (colonna binaria, al massimo 1 MB): funziona uguale con SQLite e
  PostgreSQL e segue i backup del database; niente file system da gestire nel deploy.
- **Tipi ammessi** riconosciuti dal contenuto, non dal nome: PNG e JPEG dalla firma binaria; SVG
  come testo XML con radice `<svg>`, rifiutando `<!DOCTYPE`/`<!ENTITY` (niente entità esterne
  durante la generazione del PDF), `<script>`, attributi `on…=` e `javascript:`.
- Il logo si mostra sempre con `<img>` (gli SVG così non eseguono codice); l'endpoint che lo serve
  aggiunge una `Content-Security-Policy` con `sandbox`. Nel PDF e nella pagina condivisa è
  incorporato come `data:` URI: la pagina condivisa resta senza richieste esterne.
- **Contrasto**: il colore principale deve avere un contrasto di almeno 4,5:1 con il bianco
  (pulsanti e barra hanno testo bianco). Un colore troppo chiaro è rifiutato con un messaggio che
  lo spiega; il selettore mostra il contrasto mentre si sceglie.
- Nuove dipendenze frontend approvate dall'utente: `@fontsource-variable/inter`,
  `@tabler/icons-react`. Nessuna nuova dipendenza backend (`python-multipart` arriva già con
  `fastapi[standard]`).

## Context

- Utente: `app/models/user.py`; endpoint del profilo in `app/routers/auth.py` sotto
  `/api/auth/me`.
- Report: `app/export/report.py` e il template della Fase 5; pagina condivisa della Fase 8.
- Tema Mantine in `src/theme.ts`; `MantineProvider` in `App.tsx` riceve il colore dell'utente.
- I PDF restano in Helvetica: Inter vale per l'interfaccia web.

### Fuori scope

- Logo dell'installazione impostato dall'amministratore.
- Modalità scura.
- Dati di contatto del consulente su PDF e pagina condivisa.
