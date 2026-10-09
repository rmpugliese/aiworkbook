# Plan: Fase 9 — Marchio del consulente ed estetica

## Gruppo 1: Modello e migrazione

1. `User`: `logo` (binario), `logo_content_type`, `logo_updated_at`, `brand_color`
2. Migrazione Alembic (backup di `dev.db` prima)

## Gruppo 2: Servizi

3. `app/services/branding.py`: `detect_logo_type(data)` (PNG, JPEG, SVG sicuro, altrimenti
   errore), `set_logo`, `clear_logo`, `contrast_with_white(hex)`, `set_profile(display_name,
   brand_color)`
4. `app/export/report.py`: `Branding` (data URI del logo, colore) dal proprietario del progetto

## Gruppo 3: API

5. `PATCH /api/auth/me` (nome, colore), `PUT /api/auth/me/logo` (multipart),
   `DELETE /api/auth/me/logo`, `GET /api/auth/me/logo` (sessione, `sandbox`, cache privata)
6. `UserOut`: `brand_color`, `logo_url` (con versione per la cache)

## Gruppo 4: Documenti

7. Template del report: logo in copertina, colore principale su titoli e barra della pagina
   condivisa; PDF e pagina condivisa del proprietario del progetto

## Gruppo 5: Frontend

8. Dipendenze `@fontsource-variable/inter`, `@tabler/icons-react`
9. `src/theme.ts`: font, palette, componenti; `brandColors(hex)` per il colore primario
10. `App.tsx`: tema che segue l'utente collegato
11. `Layout`: logo o nome dell'app, menu utente con avatar e voce "Profilo"; stato del backend
    solo se offline
12. Pagina `/profile`: nome, logo (carica, anteprima, rimuovi), colore con contrasto e anteprima
13. Restyling: progetti, progetto, iterazione, accesso, amministrazione

## Gruppo 6: Test e documenti

14. Backend: tipi di logo ammessi e rifiutati (SVG con script, entità, eventi), dimensione, colore
    non valido o poco contrastato, logo servito con le intestazioni giuste, report con e senza
    marchio, pagina condivisa con logo e colore del proprietario
15. Frontend: profilo (salvataggio colore, avviso di contrasto, caricamento e rimozione del
    logo), intestazione con logo, `brandColors`
16. E2E esistenti verdi; README e roadmap
