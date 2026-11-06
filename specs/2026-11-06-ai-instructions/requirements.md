# Fase 16: Indicazioni aggiuntive per l'assistente AI — Requisiti

## Scope

Chi usa l'assistente su un campo può scrivere, facoltativamente, delle **indicazioni per quella
richiesta** (es. "tono formale, il cliente è una banca", "massimo 5 punti", "concentrati sui
rischi GDPR"). L'assistente ne tiene conto in "Suggerisci una bozza", "Migliora il testo" e
"Critica e domande".

- Campo facoltativo "Indicazioni per l'assistente" che compare cliccando "Assistente", sopra
  le tre azioni.
- Massimo **1.000 caratteri**.
- Le indicazioni **non si salvano**: restano nel campo finché la pagina è aperta, così si può
  riprovare o cambiare azione senza riscriverle; ricaricando la pagina spariscono.
- Le indicazioni vengono inviate al servizio AI insieme al resto del contesto; la pagina
  "Uso dell'AI" lo dice.
- Vale per proprietario e collaboratori, come l'assistente stesso.

Escluso: istruzioni salvate nel progetto o nel profilo, modelli di istruzioni riutilizzabili,
modifica delle regole di base dell'assistente.

## Decisioni

- **Solo per richiesta** (scelta dell'utente): nessuna migrazione, nessun dato nuovo nel database.
- **Le regole di base restano** (scelta dell'utente): le indicazioni guidano tono, contenuto,
  lunghezza e focus, ma l'assistente continua a scrivere in italiano, a non inventare fatti
  (segnando "[da verificare]") e a restituire solo il testo richiesto. Il prompt di sistema lo
  dice esplicitamente e le indicazioni arrivano in una sezione separata e delimitata del
  messaggio utente.
- **Log**: come oggi solo metadati; le indicazioni rientrano nel conteggio `prompt_chars`, il
  loro testo non si conserva.
- Le indicazioni vuote o di soli spazi equivalgono a nessuna indicazione: il prompt resta
  identico a oggi.

## Contesto

- Backend: `AssistIn` in `backend/app/schemas/ai.py`, `prepare_assist` in
  `backend/app/services/ai.py`, `build_messages` e `SYSTEM` in `backend/app/ai/prompts.py`.
- Frontend: `useAssist` in `frontend/src/api/ai.ts`, `AssistantPanel` in
  `frontend/src/workbook/AssistantPanel.tsx`, test in `frontend/src/pages/Assistant.test.tsx`.
- Testi: `frontend/src/pages/legal/AiInfoPage.tsx` (cosa riceve il servizio AI). Non cambia la
  privacy policy né i termini: nessuna nuova versione dei termini.
- I test non chiamano provider AI reali.
