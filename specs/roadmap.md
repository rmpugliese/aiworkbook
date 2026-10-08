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

## Fase 3: Compilazione del workbook (Completata)

**Obiettivo:** l'utente compila le domande di un'iterazione, con salvataggio automatico.

- [x] `GET` e `PUT` delle risposte di un'iterazione (la tabella esiste dalla Fase 2)
- [x] Navigazione per fase e task (barra laterale), con la guida del task visibile
- [x] Editor delle domande `text` con salvataggio automatico (debounce) e stato "salvato /
      salvataggio in corso / errore"
- [x] Domanda `multi_choice` per i pattern di AI
- [x] Go/No-Go in forma base (verdetto e motivazione), validazione delle risposte sul server
- [x] Indicatore di avanzamento per fase
- [x] Test end-to-end Playwright: compilare, ricaricare la pagina, ritrovare i dati

---

## Fase 4: Valutazione Go/No-Go (Completata)

**Obiettivo:** i 9 fattori della Fase I e i Go/No-Go di fine fase, con la fase a cui tornare.

- [x] Componente Go/No-Go (GO / MAYBE / NO-GO + motivazione)
- [x] Riepilogo a matrice 3×3 (business / dati / esecuzione) con esito complessivo
- [x] Regola di esito della Fase I: qualsiasi NO-GO porta a "No-Go"; nessun NO-GO ma almeno un
      MAYBE porta a "Cautela"; l'utente conferma l'esito
- [x] Componente Go/No-Go di fase (Fasi II–VI): checklist dei criteri, verdetto, fase a cui
      tornare suggerita dai criteri non soddisfatti, motivazione
- [x] Indicatore dello stato di ogni fase nella navigazione (GO / MAYBE / NO-GO / da valutare)
- [x] Test sulla regola di esito e sul suggerimento della fase di ritorno
- [x] Riepilogo Go/No-Go dell'iterazione; scostamento dal suggerimento ammesso con motivazione

---

## Fase 5: Esportazione PDF (Completata)

**Obiettivo:** generare dal backend un PDF che raccoglie tutta l'iterazione, da consegnare al
cliente.

- [x] Generazione HTML + CSS di stampa convertita in PDF con WeasyPrint
- [x] Copertina (progetto, cliente, iterazione, data), indice, user story
- [x] Riepilogo Go/No-Go con la matrice 3×3 dei fattori e l'esito di ogni fase
- [x] Tutte le fasi con domande e risposte; le domande senza risposta compaiono come
      "Non compilato"
- [x] Endpoint di download e pulsante nell'interfaccia
- [x] Test: il PDF si genera e contiene titoli e risposte attese
- [ ] Export DOCX (in seguito, se serve: la stessa struttura con `python-docx`)

---

## Fase 6: Account utente

**Obiettivo:** registrazione con conferma via email, login e logout con sessioni sicure, accesso
con Google; ogni utente vede solo i propri progetti. Da completare prima di qualsiasi uso fuori
dal proprio computer.

- [ ] Modelli `users` e `sessions` con le relative migrazioni
- [ ] `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`
- [ ] Hash Argon2, cookie di sessione `HttpOnly`, protezione CSRF
- [ ] Conferma dell'indirizzo email con link a scadenza; reset della password
- [ ] Invio delle email tramite un fornitore (da scegliere); in sviluppo le email si leggono nel
      log
- [ ] Accesso con Google (OAuth 2.0 / OpenID Connect), collegato all'account con la stessa email
      verificata
- [ ] Rate limiting di base su login, registrazione e reinvio delle email
- [ ] `owner_id` sui progetti; migrazione che assegna i progetti esistenti al primo utente creato
- [ ] Controllo di proprietà su tutte le API di progetti, iterazioni, risposte ed export
- [ ] Pagine React di registrazione, login, conferma email e reset password; rotte protette
- [ ] Test sui flussi (password errata, email duplicata o non confermata, link scaduto, sessione
      scaduta, login Google simulato) e sull'isolamento tra utenti
- [ ] Altri provider di accesso (Microsoft, LinkedIn…): da valutare in seguito

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
