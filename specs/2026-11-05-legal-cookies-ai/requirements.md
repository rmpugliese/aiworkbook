# Requirements: Fase 12 — Pagine legali, cookie e trasparenza sull'AI

## Scope

Prima di aprire l'app ad altri utenti:

1. **Cookie policy** (`/cookies`): quali cookie e archivi del browser usa l'app, perché, per quanto
   tempo; nessun cookie di profilazione o di terze parti, quindi nessun consenso richiesto.
2. **Pannello cookie**: link "Cookie" nel piè di pagina che apre un pannello con l'elenco dei
   cookie (nome, scopo, durata), tutti "necessari", e il collegamento alla cookie policy. Nessun
   banner.
3. **Informativa privacy** (`/privacy`) riscritta con i dati reali del titolare.
4. **Termini d'uso** (`/terms`) aggiornati.
5. **Informativa sull'uso dell'AI** (`/ai`): cosa fa l'assistente, quando interviene (solo su
   richiesta, solo nei progetti dove è attivato), quali dati riceve, chi è il fornitore, dove sono
   i server, che tipo di modello è (open source / open weight), cosa non fa (nessun addestramento
   sui dati, nessuna decisione automatica), limiti e responsabilità dell'utente.
   I dati del fornitore vengono dalla configurazione dell'amministratore: si aggiornano da soli.
6. **Trasparenza nell'interfaccia** (AI Act, art. 50): la proposta dell'assistente è etichettata
   come generata dall'AI; il consenso per progetto rimanda all'informativa AI e mostra fornitore e
   sede.

## Decisions

- **Solo cookie tecnici** (scelta dell'utente: pannello informativo, senza banner): per le linee
  guida del Garante (giugno 2021) i cookie tecnici non richiedono consenso; basta l'informativa.
- **Dati del titolare in Amministrazione** (scelta dell'utente), salvati nel database, non nel
  codice: il repository è pubblico e i dati cambiano senza rilasci. Se mancano, le pagine mostrano
  segnaposto evidenti e l'amministrazione lo segnala.
- **Marchio dell'installazione** (scelta dell'utente): logo e colore passano dal profilo del
  consulente all'Amministrazione e valgono per tutti; la migrazione sposta quelli esistenti.
- **Servizio sperimentale, "così com'è", senza garanzie** nei termini d'uso (richiesta
  dell'utente).
- **Dati del fornitore AI nella configurazione dell'assistente** (amministrazione): fornitore, sede
  dei server, tipo di modello. Esposti in un endpoint pubblico per le pagine legali (senza chiavi né
  URL interni).
- **Avviso "Bozza"** visibile finché in Amministrazione non si spunta "Testi rivisti da un legale".
- **Nuova versione dei termini**: i testi cambiano in modo sostanziale, quindi tutti accettano di
  nuovo al primo accesso.

## Context

- Cookie attuali: `session` (sessione, 30 giorni), `csrf_token` (protezione delle richieste, di
  sessione), `oauth_state` (solo durante l'accesso con Google, 10 minuti).
- Nessun `localStorage` usato dall'app; font serviti dall'app; nessuna risorsa esterna.
- I testi restano bozze da far rivedere da un legale; non sono consulenza legale.
