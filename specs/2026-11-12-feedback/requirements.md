# Fase 19: Suggerimenti degli utenti — Requisiti

## Scope

Oggi chi usa l'app può scrivere solo dal link «Contatti» nel piè di pagina, che apre il programma
di posta (spesso non funziona con la posta via browser). La fase aggiunge un modo semplice per
mandare un'idea o segnalare un problema.

- **«Suggerisci un'idea»** per chi ha fatto l'accesso: voce nel menu utente e link nel piè di
  pagina (da tablet in su; su telefono basta il menu).
- Una finestra con il tipo (Idea, Problema, Altro) e il testo (da 10 a 4.000 caratteri), poi
  **Invia**. Alla fine un messaggio di ringraziamento.
- Il suggerimento arriva **per email** all'indirizzo di contatto dell'installazione, con
  «rispondi a» impostato sull'email di chi scrive: si risponde direttamente dalla propria posta.
- Nella home, per chi non ha l'account: «Hai domande? Scrivi a …» con l'indirizzo di contatto in
  chiaro, copiabile.

Escluso: elenco dei suggerimenti in Amministrazione, voti, allegati, modulo per chi non ha
l'account, nuove impostazioni.

## Decisioni

- **Destinatario**: l'email di contatto già esistente (Amministrazione → dati legali), o l'email
  privacy se quella è vuota. Senza indirizzo la voce non compare e l'API risponde 503.
- **Nessun salvataggio nel database**: il testo passa solo nell'email. Nei log nessun testo.
- **Limite**: 5 suggerimenti all'ora per utente, per evitare abusi.
- **Oggetto fisso** («Suggerimento: idea» ecc.): niente dati dell'utente nelle intestazioni;
  nome ed email nel corpo del messaggio.
- **Nessun modulo pubblico**: i visitatori vedono solo l'indirizzo, niente spam da bot.

## Contesto

- Email: `backend/app/email.py` (`send_email`, backend console/memory/smtp); serve «Reply-To».
- Limiti: `backend/app/auth/rate_limit.py`. Errori di invio: gestore `EmailDeliveryError` (503).
- Indirizzo: `site.legal.contact_email` già esposto da `GET /api/site`.
- Interfaccia: `UserMenu.tsx`, `Layout.tsx`, `HomePage.tsx`; informativa in `PrivacyPage.tsx`.
- Nessuna nuova dipendenza.
