# Validation: Fase 12 — Pagine legali, cookie e trasparenza sull'AI

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0
- [x] `/api/legal` è pubblico e non espone URL dell'endpoint AI, chiavi o dati interni
- [x] Le pagine mostrano i dati del titolare quando configurati, i segnaposto altrimenti
- [x] Il pannello cookie elenca esattamente i cookie che l'app imposta
- [x] L'informativa AI riflette fornitore, sede e modello configurati; assistente spento → lo dice
- [x] La proposta dell'assistente è etichettata come generata dall'AI
- [x] Nuova versione dei termini: gli utenti esistenti devono accettarla

## Verifiche manuali

- [x] Pagine leggibili su desktop e telefono; collegamenti nel piè di pagina
- [ ] Dati reali del titolare inseriti in Amministrazione sul server (li inserisce l'utente)

## Definition of Done

Test verdi, testi rivisti dall'utente, voci della Fase 12 in `specs/roadmap.md`.
