# Requirements: Fase 7 — Assistente AI

## Scope

Un modello linguistico, raggiungibile tramite un endpoint compatibile con l'API OpenAI, aiuta a
compilare i campi del workbook. Interviene solo su richiesta e non scrive mai al posto
dell'utente senza conferma.

### Configurazione (amministratore)

Nella pagina Amministrazione, sezione "Assistente AI":

| Campo | Note |
|---|---|
| Attivo | interruttore generale |
| URL base | es. `http://localhost:11434/v1` (Ollama), `http://localhost:1234/v1` (LM Studio), `https://openrouter.ai/api/v1` |
| API key | facoltativa (i server locali spesso non la chiedono); **cifrata nel database** con una chiave derivata da `APP_SECRET_KEY`; non viene mai restituita: l'interfaccia mostra solo "impostata (…ultime 4 cifre)" |
| Modello | nome del modello, es. `llama3.1:8b`, `mistral-small`, `gpt-4.1-mini` |
| Temperatura | 0–1, default 0.4 |
| Lunghezza massima della risposta | token, default 1200 |

- **Prova connessione**: una richiesta brevissima al modello; mostra esito, tempo e l'eventuale
  errore restituito dal server.
- **Dove vanno i dati**: l'app deduce "locale" se l'host è `localhost`, `127.0.0.1`, `::1` o un
  nome `.local`, altrimenti "remoto"; l'informazione compare a utenti e amministratori.

### Consenso per progetto

- Ogni progetto ha l'assistente **spento** finché il proprietario non lo attiva dalla pagina del
  progetto. L'attivazione mostra un avviso: modello, host e se è locale o remoto; le domande e le
  risposte del progetto vengono inviate a quel servizio solo quando si usa l'assistente.
- Si può disattivare in qualsiasi momento.

### Azioni su un campo

Su ogni domanda (il campo di testo o le note/motivazione), un menu "Assistente" con:

| Azione | Cosa fa | Risultato |
|---|---|---|
| **Suggerisci** | Propone una bozza di risposta | Testo da applicare |
| **Migliora** | Rende più chiaro, completo e professionale il testo già scritto, senza aggiungere fatti | Testo da applicare (richiede testo presente) |
| **Critica** | Non riscrive: elenca lacune, incoerenze con altre risposte e domande da porsi | Elenco da leggere |

- La risposta arriva **in streaming** in un pannello sotto il campo.
- Per Suggerisci e Migliora: **Sostituisci**, **Aggiungi in fondo** o **Scarta**. Applicare
  passa dal normale salvataggio automatico. Per Critica: **Copia** o **Chiudi**.
- Mentre l'assistente scrive si può **interrompere**.

### Contesto inviato al modello

Messaggio di sistema in italiano: assistente esperto della metodologia CPMAI al servizio di un
consulente; scrive in italiano, in modo concreto; non inventa fatti sul cliente; segna le ipotesi
con "[da verificare]"; niente titoli o markdown pesante. Poi, nel messaggio dell'utente:

1. Progetto (nome, cliente, descrizione), iterazione (titolo, user story)
2. Fase, gruppo, task con la sua guida; la domanda e il suo testo d'aiuto (per i Go/No-Go anche
   il verdetto scelto e i criteri)
3. Le risposte già date nell'iterazione, a partire dalla stessa fase, entro un limite di circa
   12.000 caratteri (oltre si tronca indicandolo)
4. Il testo attuale del campo e l'istruzione dell'azione

### Uso e limiti

- Registro di ogni richiesta (`ai_requests`): utente, progetto, chiave della domanda, azione,
  modello, durata, caratteri inviati e ricevuti, token se il server li riporta, esito. Mai il
  contenuto.
- Limite: 30 richieste all'ora per utente → 429.
- Errori del servizio (irraggiungibile, chiave errata, modello inesistente, timeout) → messaggio
  chiaro in italiano; nessun dato viene salvato.

### API

| Metodo | Percorso |
|---|---|
| `GET` · `PUT` | `/api/admin/ai` (configurazione; la chiave si imposta, si cambia o si rimuove, non si legge) |
| `POST` | `/api/admin/ai/test` |
| `GET` | `/api/ai/status` (attivo, modello, locale/remoto: per gli utenti) |
| `POST` | `/api/projects/{id}/ai/enable`, `/api/projects/{id}/ai/disable` |
| `POST` | `/api/projects/{id}/iterations/{iteration_id}/assist` → `text/event-stream` |

### Escluso

- Adapter nativi per altri protocolli (Anthropic, Gemini): l'astrazione li permette in seguito
- Endpoint o chiave per singolo utente
- Generazione di intere fasi in un colpo solo

## Decisions

- **Solo endpoint OpenAI-compatibili**, con `httpx` (già presente, ora dipendenza dichiarata)
  invece dell'SDK di un fornitore: un'unica integrazione copre server locali e remoti.
- **Configurazione solo dall'amministratore**; la chiave è cifrata con Fernet (`cryptography`,
  dichiarata come dipendenza) e una chiave derivata da `APP_SECRET_KEY`.
- **Consenso per progetto**, spento per default.
- **Tre azioni**: Suggerisci, Migliora, Critica.
- **Streaming via Server-Sent Events**, perché i modelli locali possono essere lenti.

## Context

- Interfaccia `LLMProvider` (Protocol) in `app/ai/`, con l'adapter OpenAI-compatibile e un
  provider finto per i test; il router riceve il provider come dipendenza.
- I test non contattano mai servizi reali: l'adapter si prova con `httpx.MockTransport`.
- Proprietà e isolamento come per il resto delle API (404 per progetti altrui).
