# Fase 15: Collaborazione tra consulenti — Requisiti

## Scope

Il proprietario di un progetto invita colleghi consulenti, che lavorano sullo stesso workbook.

| Azione | Proprietario | Collaboratore |
|---|---|---|
| Vedere il progetto, le iterazioni e le risposte | sì | sì |
| Compilare risposte, creare e modificare iterazioni (titolo, user story, stato) | sì | sì |
| Scaricare il PDF, esportare il progetto | sì | sì |
| Usare l'assistente AI (se attivato nel progetto) | sì | sì |
| Modificare nome, cliente e descrizione del progetto | sì | no |
| Archiviare, ripristinare, eliminare il progetto | sì | no |
| Attivare o disattivare l'assistente AI nel progetto | sì | no |
| Creare, revocare ed eliminare i link pubblici | sì | no |
| Invitare e rimuovere collaboratori | sì | no |
| Lasciare il progetto | — | sì |

- **Invito per email**, anche a chi non è iscritto:
  - iscritto con email confermata → vede subito il progetto e riceve un'email di avviso;
  - non iscritto (o non ancora confermato) → riceve un invito a iscriversi; il progetto compare
    quando conferma quella email (anche con Google).
- **Massimo 5 collaboratori per progetto** (inviti in attesa compresi), gratis.
- **Elenco progetti**: i progetti condivisi compaiono insieme ai propri, con "Condiviso da …".
- **Chi ha modificato**: ogni risposta registra l'ultimo autore; si vede "Modificata da Mario"
  quando l'autore è un'altra persona.
- **Conflitti**: se un collega ha modificato la stessa risposta dopo che l'hai aperta, il
  salvataggio si ferma e mostra le due versioni: tieni la tua o usa la sua. Nessuna
  sovrascrittura silenziosa.
- **Testi legali**: privacy (i collaboratori vedono i progetti; nome ed email visibili tra membri)
  e termini (responsabilità del proprietario); nuova versione dei termini.

Escluso: ruolo "solo lettura", modifica simultanea in tempo reale, notifiche delle modifiche,
trasferimento della proprietà, piani a pagamento.

## Decisioni

- **Tabella `project_members`**: progetto, utente (vuoto finché l'invito è in attesa), email
  normalizzata, chi ha invitato, data. Unica per progetto ed email. L'invito in attesa diventa
  attivo quando un account **conferma** quella email: un'iscrizione non confermata non basta.
- **Accesso nei servizi**: `get_project` accetta `user_id` e `owner_only`. Le operazioni del
  proprietario usano `owner_only=True`; il resto ammette i membri. Chi non ha accesso continua a
  ricevere 404, come oggi.
- **Conflitti con controllo ottimistico**: il salvataggio di una risposta può indicare
  `base_updated_at` (la versione da cui parte la modifica). Se la risposta salvata è più recente
  ed è stata scritta da un altro utente, la risposta è 409 con la versione attuale. Le modifiche
  della stessa persona (per esempio da due schede) non sono conflitti.
- **`answers.updated_by_id`** con `ON DELETE SET NULL`: se il collega elimina l'account, la
  risposta resta senza autore.
- **Email**: se l'invio dell'invito fallisce, l'invito resta salvato e l'interfaccia lo segnala.
- **Account eliminato**: le appartenenze spariscono con l'account; i progetti del proprietario
  spariscono anche per i collaboratori.
- **Statistiche e amministrazione**: il conteggio progetti degli utenti resta quello dei progetti
  di proprietà.

## Contesto

- Regola di `CLAUDE.md` sull'accesso ai dati: da aggiornare ("proprietario o collaboratore").
- Email in `app/email.py`; conferma dell'email in `services/auth._mark_verified` (anche Google).
- Salvataggio automatico in `frontend/src/workbook/useAutosave.ts` e `useAnswerDraft.ts`.
- Migrazione Alembic con `render_as_batch`; backup di `dev.db` prima di applicarla.
- Cambio dei termini → `TERMS_VERSION` nuova: tutti riaccettano al primo accesso.
