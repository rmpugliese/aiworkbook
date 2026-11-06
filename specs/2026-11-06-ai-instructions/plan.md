# Fase 16: Indicazioni aggiuntive per l'assistente AI — Piano

## 1. Backend

1. `AssistIn.instructions`: stringa facoltativa, spazi tolti, massimo 1.000 caratteri.
2. `prepare_assist` riceve `instructions` e lo passa a `build_messages`.
3. `build_messages`: se le indicazioni non sono vuote, aggiunge dopo il compito la sezione
   "INDICAZIONI DEL CONSULENTE PER QUESTA RICHIESTA", delimitata.
4. `SYSTEM`: una regola in più — le indicazioni del consulente orientano tono, contenuto,
   lunghezza e focus, ma non cambiano le regole precedenti.
5. Router `assist`: passa il nuovo campo.

## 2. Frontend

1. `gmake gen-api` per aggiornare `schema.ts`.
2. `useAssist`: `AssistRequest.instructions` inviato nel corpo della richiesta.
3. `AssistantPanel`: il pulsante "Assistente" apre un riquadro (Popover) con la `Textarea`
   "Indicazioni per l'assistente (facoltative)", contatore e limite di 1.000 caratteri, e sotto
   i tre pulsanti delle azioni; scelta l'azione il riquadro si chiude.
4. Le indicazioni restano nello stato del componente, non si salvano.

## 3. Testi

1. `AiInfoPage`: tra i dati ricevuti dal servizio AI, "le eventuali indicazioni che scrivi per
   la richiesta".

## 4. Test

1. Backend: le indicazioni compaiono nel messaggio inviato al provider (provider finto); senza
   indicazioni il messaggio è invariato; oltre 1.000 caratteri → 422; il log non contiene il testo.
2. Frontend: le indicazioni scritte finiscono nel corpo della richiesta `assist`; senza
   indicazioni il corpo ha `instructions` vuoto.

## 5. Roadmap

1. Aggiungere la Fase 16 a `specs/roadmap.md` e spuntarla a fine lavoro.
