# Fase 17: Logo personale nel PDF e invito a sostenere un'ODV — Piano

## 1. Migrazione

1. Colonne su `users`: `logo` (binario, deferred), `logo_content_type`, `logo_updated_at`.
2. Colonne su `site_settings`: `donation_enabled` (default false), `donation_text`,
   `donation_url`.
3. Downgrade che le rimuove; prova su SQLite e PostgreSQL.

## 2. Modelli e servizi

1. `User`: le tre colonne del logo, con commento come quelle del sito.
2. `SiteSettings`: le tre colonne dell'invito.
3. `branding`: `set_user_logo`, `clear_user_logo` (riusano `prepare_logo`);
   `document_branding(db, user=None)` usa il logo dell'utente se c'è, altrimenti quello del
   sito; il colore è sempre del sito.
4. `export.py` passa l'utente che genera il PDF; `shares.py` resta senza utente.
5. Servizio del sito: lettura e salvataggio dell'invito, con validazione (testo massimo 600
   caratteri, link solo `https://`).

## 3. Router API

1. `PUT /api/auth/me/logo` (upload), `DELETE /api/auth/me/logo`, `GET /api/auth/me/logo`
   (solo l'utente stesso, stesse intestazioni di sicurezza del logo del sito).
2. `UserOut`: `has_logo` e `logo_updated_at` (per invalidare la cache dell'anteprima).
3. `GET /api/site`: l'invito (`donation`: testo e link, solo se acceso e completo).
4. Amministrazione: l'invito nello schema di lettura e scrittura del sito.
5. `make gen-api` per aggiornare `frontend/src/api/schema.ts`.

## 4. Frontend

1. Profilo: scheda "Il tuo logo nei PDF" con anteprima, carica, rimuovi, e una riga che spiega
   dove compare (solo nei PDF che scarichi tu).
2. Sotto la scheda, l'invito dal sito, se presente: testo e link "Sostieni l'associazione" in
   una nuova scheda (`rel="noopener noreferrer"`), senza parametri aggiunti.
3. Amministrazione del sito: interruttore, testo e link dell'invito, con il testo proposto come
   segnaposto.
4. Riuso dei componenti di `BrandCards.tsx` dove possibile.

## 5. Testi legali e documentazione

1. Privacy policy: il logo tra i dati facoltativi dell'utente, cancellato con l'account.
2. Export "I tuoi dati": indica se c'è un logo personale.
3. `specs/roadmap.md`: Fase 17 con le voci spuntate a fase completata; `README.md` se cita il
   marchio solo del sito.

## 6. Test

1. Backend: upload valido e rifiutato (tipo, dimensione, SVG non sicuro); un utente non vede né
   cambia il logo di un altro; PDF con logo personale, senza logo (logo del sito) e del
   collaboratore; il PDF della pagina condivisa usa sempre il logo del sito; cancellazione
   dell'account; invito mostrato solo se acceso e completo, link non https rifiutato.
2. Frontend: scheda del logo (carica, anteprima, rimuovi, errori); invito presente o assente nel
   profilo; campi dell'invito in Amministrazione.
3. E2E esistenti verdi.
