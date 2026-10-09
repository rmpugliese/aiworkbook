# Validation: Fase 9 — Marchio del consulente ed estetica

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0

### Copertura richiesta

- [x] Logo PNG, JPEG e SVG accettati; GIF, file finti (estensione giusta, contenuto sbagliato) e
      oltre 1 MB rifiutati
- [x] SVG con `<script>`, `onload=`, `javascript:` o `<!ENTITY` rifiutati
- [x] Il logo è servito solo al proprietario, con `Content-Security-Policy` `sandbox`
- [x] Colore non esadecimale o con contrasto < 4,5:1 rifiutato con un messaggio chiaro
- [x] PDF e pagina condivisa mostrano logo e colore del proprietario; senza marchio, aspetto
      predefinito
- [x] Interfaccia: profilo (nome, colore con contrasto, logo caricato e rimosso), intestazione con
      logo, tema con il colore dell'utente

## Verifiche manuali

- [x] Caricare un logo reale (es. Perl Consulting) e un colore: intestazione, PDF e pagina
      condivisa (provato dall'utente)
- [x] Giro delle pagine a 1280 px e a 375 px: niente scorrimento orizzontale, testi leggibili
- [x] Senza marchio l'app resta curata

## Sicurezza

- [x] Gli SVG non eseguono codice né caricano risorse esterne in nessuno dei punti in cui
      compaiono

## Definition of Done

Test verdi, prova manuale con un logo reale, voci della Fase 9 spuntate in `specs/roadmap.md`,
branch pronto per il merge su `main`.
