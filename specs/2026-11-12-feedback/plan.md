# Fase 19: Suggerimenti degli utenti — Piano

## 1. Email

1. `send_email` accetta `reply_to` facoltativo (intestazione «Reply-To» via SMTP).
2. `send_feedback(to, kind, sender_name, sender_email, message)`.

## 2. API

1. `FeedbackIn`: `kind` (`idea`, `problem`, `other`), `message` (10–4.000 caratteri, spazi tolti).
2. `POST /api/feedback` (utente con accesso): destinatario dall'indirizzo di contatto; 503 se
   manca; 429 oltre 5 invii all'ora per utente; 204 se inviato.

## 3. Frontend

1. `useSendFeedback` in `src/api/feedback.ts`.
2. `FeedbackModal`: tipo, testo con contatore, Invia; ringraziamento e chiusura.
3. Voce nel menu utente e link nel piè di pagina, solo se c'è un indirizzo di contatto.
4. Home: riga con l'indirizzo di contatto nel riquadro finale.

## 4. Documenti

1. Informativa privacy: i suggerimenti arrivano per email al titolare e non restano nell'app.
2. README e roadmap.

## 5. Test

1. Backend: invio con Reply-To e testo, tipi non validi, testo troppo corto, anonimo 401,
   indirizzo mancante 503, limite 429, intestazione Reply-To via SMTP.
2. Frontend: invio dal menu, errore mostrato, voce assente senza indirizzo, indirizzo nella home.
