# Plan: Fase 7 — Assistente AI

## Gruppo 1: Modelli e configurazione

1. Tabelle `ai_settings` (una riga), `ai_requests`; `projects.ai_enabled_at`; migrazione
2. `app/ai/secrets.py`: cifratura e decifratura della chiave (Fernet da `APP_SECRET_KEY`)

## Gruppo 2: Provider

3. `app/ai/provider.py`: Protocol `LLMProvider` (`stream(messages)`, `ping()`), adapter
   `OpenAICompatibleProvider` con `httpx` (streaming SSE di `/chat/completions`), errori tradotti
   in `AIServiceError`; `endpoint_location(url)` → locale/remoto
4. Test dell'adapter con `httpx.MockTransport`: parsing dello stream, errori HTTP, timeout

## Gruppo 3: Prompt e servizio

5. `app/ai/prompts.py`: messaggio di sistema, istruzioni per azione, costruzione del contesto con
   limite di lunghezza
6. `app/services/ai.py`: lettura e salvataggio della configurazione, consenso del progetto,
   controlli (attivo, consenso, proprietà, testo per Migliora), limite orario, registro

## Gruppo 4: API

7. Router `admin` (configurazione e prova), `ai` (stato), progetti (consenso, `assist` in
   streaming); dipendenza `get_llm_provider` sostituibile nei test
8. `make gen-api`

## Gruppo 5: Frontend

9. Amministrazione: sezione "Assistente AI" con modulo, chiave mai mostrata, prova connessione
10. Pagina del progetto: interruttore del consenso con avviso
11. `useAssist`: lettura dello stream, interruzione
12. `AssistantMenu` e pannello della proposta nei campi delle domande; applicazione tramite la
    bozza (e quindi l'autosave)

## Gruppo 6: Test

13. Backend: prompt (contesto, troncamento), regole (spento, senza consenso, Migliora senza
    testo, limite), streaming dell'endpoint con provider finto, registro senza contenuti,
    isolamento, chiave cifrata e mai restituita
14. Frontend: consenso, azione Suggerisci con stream simulato e Sostituisci/Aggiungi/Scarta,
    Critica in sola lettura, configurazione dell'amministratore
