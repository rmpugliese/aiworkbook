# Fase 15: Collaborazione tra consulenti — Piano

## 1. Dati

1. Modello `ProjectMember` e colonna `answers.updated_by_id`.
2. Migrazione Alembic (backup di `dev.db`), test di migrazione.

## 2. Accesso

1. `services/projects.get_project(..., user_id, owner_only=False)` e `get_iteration`: proprietario
   o membro attivo; `list_projects` include i progetti condivisi con ruolo e nome del proprietario.
2. Ogni servizio e router passa `user_id`; `owner_only=True` per modifica del progetto, archivio,
   eliminazione, consenso AI, link pubblici e gestione dei membri.
3. Test di isolamento: collaboratore ammesso dove previsto, 404 per le azioni del proprietario
   e per chi non è membro.

## 3. Membri e inviti

1. `services/members.py`: elenco, invito (limite 5, niente doppioni, non a se stessi), rimozione,
   uscita; attivazione degli inviti in attesa alla conferma dell'email.
2. Email di invito per iscritti e non iscritti.
3. Endpoint `GET/POST /api/projects/{id}/members`, `DELETE /api/projects/{id}/members/{member_id}`.

## 4. Risposte

1. `updated_by_id` al salvataggio; `AnswerOut.updated_by` (id e nome).
2. `AnswerIn.base_updated_at` e 409 con la versione attuale in caso di conflitto.

## 5. Frontend

1. Elenco progetti con "Condiviso da …"; pagina progetto con la scheda Collaboratori (invito,
   elenco, rimozione, "Lascia il progetto"); azioni del proprietario nascoste ai collaboratori.
2. Iterazione: "Condividi" solo per il proprietario; "Modificata da …" sulle risposte.
3. Conflitto: pannello con le due versioni e i pulsanti "Tieni la mia" e "Usa la sua".

## 6. Testi legali e chiusura

1. Privacy e termini aggiornati, nuova `TERMS_VERSION`; `CLAUDE.md` aggiornato.
2. Roadmap; lint, tipi, test backend e frontend, test su PostgreSQL.
