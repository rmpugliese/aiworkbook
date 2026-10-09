# Validation: Fase 7 — Assistente AI

## Test automatici

- [x] `make test`, `make lint` e `make e2e` terminano con codice 0
- [x] Nessun test contatta un servizio reale

### Copertura richiesta

- [x] Adapter: stream SSE ricomposto; errori HTTP, di rete e timeout tradotti in messaggi chiari
- [x] La chiave è cifrata nel database e non compare mai nelle risposte dell'API
- [x] Endpoint locale/remoto riconosciuto dall'host
- [x] Assistente spento o progetto senza consenso → errore chiaro; Migliora senza testo → 422
- [x] Il contesto contiene progetto, user story, task, domanda e le altre risposte; oltre il limite
      viene troncato
- [x] Limite orario → 429; registro delle richieste senza contenuti
- [x] Progetti altrui → 404 anche per consenso e assistente
- [x] Interfaccia: consenso con avviso; proposta in streaming; Sostituisci, Aggiungi e Scarta;
      Critica senza applicazione; configurazione e prova dell'amministratore

## Verifiche manuali

- [x] Configurare un endpoint reale e provare la connessione (LM Studio, `openai/gpt-oss-20b`,
      1,65 s; adapter provato anche con Ollama `llama3.2`)
- [x] Attivare l'assistente su un progetto (copia del database) e usare Suggerisci, Sostituisci,
      Scarta e Critica; Migliora coperto dai test automatici
- [x] Il markdown delle risposte viene ripulito (emerso nella prova: il modello usava il grassetto)
- [ ] Interrompere una risposta lunga (implementato, non provato a mano)
- [x] Con l'endpoint spento: messaggio d'errore chiaro, il campo resta com'era (test automatici)

## Definition of Done

Test verdi, prova manuale con un modello vero, voci della Fase 7 spuntate in
`specs/roadmap.md`, branch pronto per il merge su `main`.
