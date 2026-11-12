# Fase 17: Logo personale nel PDF e invito a sostenere un'ODV — Requisiti

## Scope

### Logo personale nel PDF

Ogni utente può caricare **il proprio logo** dal profilo. Quando quell'utente scarica il PDF di
un'iterazione, la copertina e l'intestazione del PDF mostrano il suo logo al posto di quello del
sito.

- Riquadro "Il tuo logo nei PDF" nella pagina Profilo: anteprima, carica, sostituisci, rimuovi.
- Stesse regole del logo del sito: PNG, JPEG o SVG riconosciuti dal contenuto, massimo 1 MB,
  SVG solo se sicuro (stessa validazione di `prepare_logo`).
- Il logo usato è quello **di chi genera il PDF**: il proprietario vede il suo, un collaboratore
  che scarica lo stesso PDF vede il proprio.
- Senza logo personale il PDF resta come oggi, con il logo del sito.
- Il logo del sito resta ovunque altrove: intestazione dell'app, accesso, pagine legali,
  **pagina condivisa** e il PDF scaricato dalla pagina condivisa (lì non c'è un utente che genera).
- Il **colore** del PDF resta quello del sito (scelta dell'utente: solo il logo).

### Invito facoltativo a sostenere un'organizzazione

Nel profilo, vicino al riquadro del logo, un invito discreto a una donazione **spontanea** a
Glioblastoma.IT ODV, con il link alla pagina dei contributi.

- Configurabile in **Amministrazione** (scheda del sito): interruttore, testo (massimo 600
  caratteri) e link (https). Interruttore spento, testo o link vuoti: l'invito non compare.
- Nessun obbligo e nessun legame con le funzioni: il logo funziona allo stesso modo per chi dona
  e per chi no. L'app non sa e non registra chi dona; il link si apre in una nuova scheda senza
  parametri di tracciamento.
- Testo proposto (modificabile in Amministrazione):

  > Il logo personale è gratuito. Se l'app ti è utile, puoi sostenere con una donazione
  > spontanea **Glioblastoma.IT ODV**, che aiuta i pazienti con glioblastoma e le loro famiglie.
  > Chi ha creato AI Project Workbook presiede l'associazione.

  Link: `https://www.glioblastomamultiforme.it/contributi/`

Escluso: invito nella home, nel piè di pagina o nei PDF; colore personale; logo personale sulla
pagina condivisa; statistiche sulle donazioni.

## Decisioni

- **Solo nel PDF** (scelta dell'utente): il marchio del sito resta l'identità dell'app; il logo
  personale serve al consulente per consegnare un documento suo al cliente.
- **Marchio personale gratuito** (scelta dell'utente): supera la decisione del 5 novembre 2026 di
  tenerlo come possibile funzione a pagamento. I testi promozionali possono ora dire "con il tuo
  logo".
- **Invito solo nel profilo** (scelta dell'utente), **configurabile** in Amministrazione: il
  testo o l'organizzazione si cambiano senza un nuovo rilascio, e l'invito si può spegnere.
- **Trasparenza**: chi gestisce l'app presiede l'ODV (l'ODV è d'accordo a essere citata); il
  testo proposto lo dichiara.
- Il logo personale vive nel database come quello del sito (niente file su disco, segue i
  backup) e si cancella con l'account.
- Si riusano `prepare_logo`, le colonne e i nomi già usati per il logo del sito.

## Contesto

- Backend: logo del sito in `backend/app/models/site.py` e `backend/app/services/branding.py`
  (`prepare_logo`, `logo_data_uri`, `document_branding`); PDF dell'utente da
  `backend/app/services/export.py`, PDF della pagina condivisa da `backend/app/routers/shares.py`;
  modello `Branding` in `backend/app/export/report.py`.
- Le colonne del logo sull'utente esistevano nella Fase 9 e sono state spostate sul sito nella
  Fase 12 (commit 34f2085): si aggiungono di nuovo con una migrazione nuova, senza riusare quella
  vecchia.
- Frontend: `frontend/src/pages/ProfilePage.tsx`, schede del logo del sito in
  `frontend/src/components/BrandCards.tsx`, amministrazione del sito in `SiteAdmin`.
- Testi legali: la privacy policy elenca il logo tra i dati dell'utente; l'export "I tuoi dati"
  dice se c'è un logo (il file non si include). Nessuna nuova versione dei termini.
- Nessuna nuova dipendenza.
