# Fase 14: Statistiche degli iscritti — Verifica

## Automatica

- `npm test`, `npm run typecheck`, `npm run lint` passano (il backend non cambia).
- `signupStats` con "oggi" fisso: un utente iscritto oggi conta nei 7 e nei 30 giorni; uno di 10
  giorni fa solo nei 30; uno di 40 giorni fa solo nel totale; i giorni vuoti valgono 0 e la serie
  ha 30 elementi, dall'ultimo al più vecchio in ordine cronologico.
- La pagina Amministrazione mostra Iscritti, Confermati e Nuovi con i valori attesi.

## Manuale

1. Amministrazione: la scheda Statistiche è in cima, i numeri corrispondono all'elenco utenti.
2. Passando sopra una barra si vedono data e numero di iscrizioni.
3. Su schermo stretto il grafico resta leggibile, senza scorrimento orizzontale della pagina.

## Sicurezza

- Nessun nuovo endpoint: i dati sono quelli già riservati agli amministratori.

## Definizione di fatto

Verifiche superate, roadmap aggiornata, commit con l'approvazione dell'utente.
