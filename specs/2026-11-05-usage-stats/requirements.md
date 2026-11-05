# Fase 14: Statistiche degli iscritti — Requisiti

## Scope

Una scheda **Statistiche** in cima alla pagina Amministrazione, per capire se il servizio piace.

| Numero | Definizione |
|---|---|
| Iscritti | tutti gli account |
| Confermati | account con l'email confermata |
| Nuovi negli ultimi 7 giorni | iscritti negli ultimi 7 giorni, oggi compreso |
| Nuovi negli ultimi 30 giorni | iscritti negli ultimi 30 giorni, oggi compreso |
| Grafico | iscrizioni giorno per giorno negli ultimi 30 giorni, a barre |

Escluso: utilizzo (progetti, PDF, AI), utenti attivi, email di avviso, nuovi eventi registrati.

## Decisioni

- **Calcolo nel browser** dall'elenco utenti che la pagina Amministrazione già carica
  (`GET /api/admin/users`, con `created_at` ed `email_verified_at`): nessun nuovo endpoint, nessuna
  migrazione, nessun dato in più esposto. I giorni seguono il fuso orario del browser.
- **Grafico a barre fatto a mano** con elementi Mantine e CSS, senza librerie di grafici.
- Solo conteggi: nessun contenuto dei progetti, come il resto dell'amministrazione.

## Contesto

- Pagina `frontend/src/pages/AdminUsersPage.tsx`, hook `useAdminUsers`.
- Funzioni di calcolo pure in `src/stats.ts`, testate con Vitest con una data "oggi" fissa.
- Accessibilità: il grafico ha un'etichetta testuale e un titolo per ogni barra (data e numero).
