# Roadmap

Le fasi sono volutamente piccole: ognuna dovrebbe essere realizzabile in una sessione di lavoro
mirata e rilasciabile da sola. Per ogni fase si crea una spec in
`specs/YYYY-MM-DD-<nome>/` (`requirements.md`, `plan.md`, `validation.md`) prima di scrivere
codice.

---

## Fase 0: Scaffolding del monorepo

**Obiettivo:** backend e frontend che partono, si testano e si parlano.

- [ ] `backend/` con uv, FastAPI, endpoint `GET /api/health`, configurazione da env
- [ ] SQLAlchemy + Alembic configurati su SQLite, prima migrazione vuota
- [ ] pytest, ruff e mypy funzionanti, con un test per `/api/health`
- [ ] `frontend/` con Vite, React, TypeScript e Mantine, con una pagina che mostra lo stato di
      `/api/health`
- [ ] Proxy di Vite verso il backend; generazione dei tipi da OpenAPI (`npm run gen:api`)
- [ ] Vitest, ESLint e Prettier funzionanti
- [ ] README con i comandi di avvio

---

## Fase 1: Definizione strutturata del workbook

**Obiettivo:** tutta la struttura del workbook, parafrasata in italiano, caricabile e servita
via API.

- [ ] Schema Pydantic del template (fasi → gruppi → task → domande, tipi `text`, `go_no_go`,
      `multi_choice`)
- [ ] `template_v1.yaml` completo per le 6 fasi, con testi parafrasati (vedi
      `specs/workbook-model.md`)
- [ ] Loader con validazione: chiavi uniche, tipi validi, opzioni presenti per `multi_choice`
- [ ] `GET /api/template` (e `/api/template/{version}`)
- [ ] Test: il template si carica, ci sono 6 fasi, le chiavi sono uniche, ci sono 9 domande
      Go/No-Go

---

## Fase 2: Account utente

**Obiettivo:** registrazione, login e logout con sessioni sicure.

- [ ] Modelli `users` e `sessions` con le relative migrazioni
- [ ] `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`
- [ ] Hash Argon2, cookie di sessione `HttpOnly`, protezione CSRF
- [ ] Rate limiting di base sul login
- [ ] Pagine React di registrazione e login, rotte protette
- [ ] Test sui flussi felici e sugli errori (password errata, email duplicata, sessione scaduta)

---

## Fase 3: Progetti e iterazioni

**Obiettivo:** ogni utente gestisce i propri progetti e le loro iterazioni.

- [ ] Modelli `projects` e `iterations` con le relative migrazioni
- [ ] API CRUD con controllo di proprietà (un utente non vede i progetti altrui)
- [ ] Nuova iterazione vuota oppure copiata dalla precedente
- [ ] Dashboard React: elenco dei progetti, dettaglio del progetto con le iterazioni
- [ ] Test su isolamento tra utenti e copia di un'iterazione

---

## Fase 4: Compilazione del workbook

**Obiettivo:** l'utente compila le domande di un'iterazione, con salvataggio automatico.

- [ ] Modello `answers` con migrazione; `GET` e `PUT` delle risposte di un'iterazione
- [ ] Navigazione per fase e task (barra laterale), con la guida del task visibile
- [ ] Editor delle domande `text` con salvataggio automatico (debounce) e stato "salvato /
      salvataggio in corso / errore"
- [ ] Domanda `multi_choice` per i pattern di AI
- [ ] Indicatore di avanzamento per fase
- [ ] Test end-to-end Playwright: compilare, ricaricare la pagina, ritrovare i dati

---

## Fase 5: Valutazione Go/No-Go

**Obiettivo:** i 9 fattori con verdetto e motivazione, più un riepilogo.

- [ ] Componente Go/No-Go (GO / MAYBE / NO-GO + motivazione)
- [ ] Riepilogo a matrice 3×3 (business / dati / esecuzione) con esito complessivo
- [ ] Regola di esito: qualsiasi NO-GO porta a "No-Go"; nessun NO-GO ma almeno un MAYBE porta
      a "Cautela"
- [ ] Test sulla regola di esito

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
