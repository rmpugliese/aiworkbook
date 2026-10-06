# Validation: Fase 2 — Progetti e iterazioni

## Test automatici

- [x] `make test` termina con codice 0
- [x] `make lint` termina con codice 0

### Copertura richiesta

- [x] Creare un progetto crea anche l'iterazione 1 con la versione corrente del template
- [x] Nome vuoto o troppo lungo → 422
- [x] L'elenco esclude gli archiviati per default e li mostra con `archived=true`
- [x] Eliminare un progetto non archiviato → 409; con il nome sbagliato → 422; con il nome giusto
      elimina progetto, iterazioni e risposte
- [x] Le iterazioni sono numerate 1, 2, 3… per progetto
- [x] La copia duplica risposte e user story; un `copy_from_iteration_id` di un altro progetto →
      404
- [x] Iterazione richiesta tramite un progetto sbagliato → 404
- [x] Frontend: elenco vuoto e pieno, creazione di un progetto, conferma dell'eliminazione
      abilitata solo con il nome esatto

## Verifiche manuali

- [x] `make migrate` applica la migrazione su un `dev.db` esistente
- [x] Nel browser: creare un progetto, salvare la user story, aggiungere un'iterazione copiata,
      archiviare, vedere il progetto con il filtro ed eliminarlo (modifica del progetto, iterazione
      vuota e ripristino sono coperti dai test automatici, non provati a mano)
- [x] Dopo il riavvio del backend i dati sono ancora presenti
- [x] Testi dell'interfaccia in italiano, date in formato italiano

## Definition of Done

Test e lint verdi, verifiche manuali confermate, voci della Fase 2 spuntate in
`specs/roadmap.md`, branch pronto per il merge su `main`.
