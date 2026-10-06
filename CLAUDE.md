# CLAUDE.md

Applicazione web per compilare, salvare, condividere ed esportare il workbook della metodologia
CPMAI, con un assistente AI opzionale.

## Metodo di lavoro: Spec-Driven Development

1. La **costituzione** del progetto è in `specs/`: leggila prima di ogni lavoro.
   - `specs/mission.md`: scopo, pubblico, principi
   - `specs/tech-stack.md`: stack e convenzioni (non aggiungere dipendenze senza approvazione)
   - `specs/workbook-model.md`: struttura del workbook, politica sui contenuti, modello dati
   - `specs/roadmap.md`: le fasi, in ordine
2. Ogni fase inizia con la skill `feature-spec`: crea il branch, intervista l'utente e scrive
   `specs/YYYY-MM-DD-<nome>/` con `requirements.md`, `plan.md` e `validation.md`.
3. Si implementa seguendo `plan.md`, poi si verifica con `validation.md`.
4. A fase completata si spuntano le voci in `specs/roadmap.md`.

## Regole non negoziabili

- **Mai copiare testi del workbook PMI** nel codice, nei template o nei test: si parafrasa. Il PDF
  sta in `~/Development/cpmai/` e non va mai aggiunto al repository.
- Le chiavi delle domande (`p1.objectives.business_objectives.problem` ecc.) non si rinominano
  dopo il rilascio.
- Ogni endpoint che legge o scrive dati di un progetto verifica che l'utente ne sia proprietario
  (oppure, in sola lettura, che il token di condivisione sia valido). Fino alla Fase 5 (account)
  l'app è in modalità locale a utente singolo e non va esposta in rete: i nuovi endpoint vanno
  comunque scritti in modo che aggiungere il controllo di proprietà sia semplice.
- I test automatici non chiamano mai provider AI reali.
- L'interfaccia è in italiano; il codice, gli identificatori e i commit sono in inglese.

## Comandi

Vedi la tabella in `specs/tech-stack.md` (si definiscono nella Fase 0).
