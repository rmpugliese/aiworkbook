# Roadmap

Le fasi sono volutamente piccole: ognuna dovrebbe essere realizzabile in una sessione di lavoro
mirata e rilasciabile da sola. Per ogni fase si crea una spec in
`specs/YYYY-MM-DD-<nome>/` (`requirements.md`, `plan.md`, `validation.md`) prima di scrivere
codice.

---

## Fase 0: Scaffolding del monorepo (Completata)

**Obiettivo:** backend e frontend che partono, si testano e si parlano.

- [x] `backend/` con uv, FastAPI, endpoint `GET /api/health`, configurazione da env
- [x] SQLAlchemy + Alembic configurati su SQLite, prima migrazione vuota
- [x] pytest, ruff e mypy funzionanti, con un test per `/api/health`
- [x] `frontend/` con Vite, React, TypeScript e Mantine, con una pagina che mostra lo stato di
      `/api/health`
- [x] Proxy di Vite verso il backend; generazione dei tipi da OpenAPI (`npm run gen:api`)
- [x] Vitest, oxlint e Prettier funzionanti
- [x] README con i comandi di avvio

---

## Fase 1: Definizione strutturata del workbook (Completata)

**Obiettivo:** tutta la struttura del workbook, parafrasata in italiano, caricabile e servita
via API.

- [x] Schema Pydantic del template (fasi → gruppi → task → domande, tipi `text`, `go_no_go`,
      `multi_choice`)
- [x] `templates/v1.yaml` completo per le 6 fasi, con testi parafrasati (vedi
      `specs/workbook-model.md`)
- [x] Loader con validazione: chiavi uniche, tipi validi, opzioni presenti per `multi_choice`
- [x] `GET /api/template` (e `/api/template/{version}`)
- [x] Test: il template si carica, ci sono 6 fasi, le chiavi sono uniche, ci sono 9 domande
      Go/No-Go
- [x] Go/No-Go di fine fase (tipo `phase_gate`) in tutte le 6 fasi, con la fase a cui tornare

---

## Fase 2: Progetti e iterazioni (Completata)

**Obiettivo:** gestire più progetti e le loro iterazioni. Per ora in modalità locale a utente
singolo, senza login: l'app si usa solo sul proprio computer.

- [x] Modelli `projects` e `iterations` con le relative migrazioni (`owner_id` arriverà con gli
      account, Fase 5)
- [x] API CRUD di progetti e iterazioni
- [x] Tabella `answers` (anticipata dalla Fase 3, serve alla copia delle iterazioni)
- [x] Nuova iterazione vuota oppure copiata da una precedente
- [x] Archiviazione ed eliminazione definitiva con conferma del nome
- [x] Dashboard React: elenco dei progetti, dettaglio del progetto con le iterazioni
- [x] Test su CRUD e copia di un'iterazione
- [x] Nessun nuovo tentativo sugli errori 4xx lato frontend (le richieste ripetute bloccavano i reindirizzamenti)

---

## Fase 3: Compilazione del workbook

**Obiettivo:** l'utente compila le domande di un'iterazione, con salvataggio automatico.

- [ ] `GET` e `PUT` delle risposte di un'iterazione (la tabella esiste dalla Fase 2)
- [ ] Navigazione per fase e task (barra laterale), con la guida del task visibile
- [ ] Editor delle domande `text` con salvataggio automatico (debounce) e stato "salvato /
      salvataggio in corso / errore"
- [ ] Domanda `multi_choice` per i pattern di AI
- [ ] Indicatore di avanzamento per fase
- [ ] Test end-to-end Playwright: compilare, ricaricare la pagina, ritrovare i dati

---

## Fase 4: Valutazione Go/No-Go

**Obiettivo:** i 9 fattori della Fase I e i Go/No-Go di fine fase, con la fase a cui tornare.

- [ ] Componente Go/No-Go (GO / MAYBE / NO-GO + motivazione)
- [ ] Riepilogo a matrice 3×3 (business / dati / esecuzione) con esito complessivo
- [ ] Regola di esito della Fase I: qualsiasi NO-GO porta a "No-Go"; nessun NO-GO ma almeno un
      MAYBE porta a "Cautela"; l'utente conferma l'esito
- [ ] Componente Go/No-Go di fase (Fasi II–VI): checklist dei criteri, verdetto, fase a cui
      tornare suggerita dai criteri non soddisfatti, motivazione
- [ ] Indicatore dello stato di ogni fase nella navigazione (GO / MAYBE / NO-GO / da valutare)
- [ ] Test sulla regola di esito e sul suggerimento della fase di ritorno

---

## Fase 5: Account utente

**Obiettivo:** registrazione, login e logout con sessioni sicure; ogni utente vede solo i propri
progetti. Da completare prima di qualsiasi uso fuori dal proprio computer.

- [ ] Modelli `users` e `sessions` con le relative migrazioni
- [ ] `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`
- [ ] Hash Argon2, cookie di sessione `HttpOnly`, protezione CSRF
- [ ] Rate limiting di base sul login
- [ ] `owner_id` sui progetti; migrazione che assegna i progetti esistenti al primo utente creato
- [ ] Controllo di proprietà su tutte le API di progetti, iterazioni e risposte
- [ ] Pagine React di registrazione e login, rotte protette
- [ ] Test sui flussi (password errata, email duplicata, sessione scaduta) e sull'isolamento tra
      utenti

---

## Fase 6: Esportazione del documento

**Obiettivo:** generare un documento leggibile da un'iterazione.

- [ ] Export DOCX: copertina (progetto, cliente, iterazione, data), indice, fasi e risposte,
      riepilogo Go/No-Go
- [ ] Le domande senza risposta compaiono come "Non compilato"
- [ ] Export PDF (decidere tra WeasyPrint e conversione da DOCX)
- [ ] Pulsante di download nell'interfaccia
- [ ] Test: il documento si genera e contiene titoli e risposte attese

---

## Fase 7: Condivisione in sola lettura

**Obiettivo:** il consulente condivide un'iterazione con il cliente.

- [ ] Modello `share_links`; creazione, elenco e revoca dei link
- [ ] Pagina pubblica `/s/{token}` in sola lettura, senza login, con download del documento
- [ ] Scadenza opzionale; link revocato o scaduto restituisce 404
- [ ] Test: il link non permette modifiche, un link revocato non funziona, il token non è
      indovinabile

---

## Fase 8: Assistente AI

**Obiettivo:** aiuto alla compilazione su richiesta dell'utente.

- [ ] Protocol `LLMProvider` e adapter Anthropic (SDK ufficiale, streaming, fallback lato server)
- [ ] Azione **Suggerisci**: bozza basata sulla guida del task e sulle risposte già date nel
      progetto
- [ ] Azione **Rifinisci**: migliora un testo scritto dall'utente, mantenendone il contenuto
- [ ] Interfaccia: anteprima della proposta, confronto con il testo attuale, Accetta / Scarta
      (nessuna sovrascrittura automatica)
- [ ] Registrazione in `ai_usage` e quota giornaliera per utente
- [ ] Provider finto per i test; nessuna chiamata reale nei test automatici

---

## Fase 9: Preparazione al rilascio pubblico

**Obiettivo:** rendere l'app sicura e conforme per utenti esterni.

- [ ] Verifica dell'email e reset della password (fornitore email da scegliere)
- [ ] Privacy policy, termini d'uso, consenso; export e cancellazione dei dati dell'utente (GDPR)
- [ ] Revisione di sicurezza (OWASP), header di sicurezza, rate limiting globale
- [ ] Scelta del nome dell'app e verifica dei testi rispetto alla politica sui contenuti
- [ ] Deploy su PostgreSQL, CI su GitHub Actions, backup
- [ ] Monitoraggio degli errori

---

## Più avanti (non pianificato)

- Storico delle revisioni delle risposte
- Collaborazione tra più consulenti sullo stesso progetto
- Commenti del cliente sul documento condiviso
- Interfaccia in inglese
- Piani a pagamento per consulenti
