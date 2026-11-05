# Fase 14: Statistiche degli iscritti — Piano

## 1. Calcolo

1. `src/stats.ts`: `signupStats(users, now)` → totale, confermati, nuovi 7 e 30 giorni e serie dei
   30 giorni (data locale, conteggio).
2. Test Vitest: confini dei giorni, giorni senza iscrizioni a zero, utenti più vecchi di 30 giorni.

## 2. Interfaccia

1. `components/SignupStatsCard.tsx`: quattro numeri e grafico a barre degli ultimi 30 giorni
   (barre proporzionali al massimo, titolo con data e conteggio, etichette di inizio e fine).
2. In `AdminUsersPage` la scheda va in cima, prima del marchio.
3. Test della pagina: i numeri compaiono con dati di prova.

## 3. Chiusura

1. Roadmap aggiornata; lint, tipi e test frontend.
