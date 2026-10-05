# Modello del workbook e dei dati

Questo documento descrive **come l'app rappresenta il workbook** e quali dati salva. È il
riferimento di dominio per tutte le fasi della roadmap.

Fonte: `~/Development/cpmai/CPMAI_Workbook.pdf` (versione luglio 2025, 97 pagine), che resta
**fuori dal repository**.

## Politica sui contenuti

- **Struttura fedele**: stesse fasi, gruppi di task, task e domande, nello stesso ordine.
- **Testo parafrasato**: titoli, guide e domande si riscrivono in italiano con parole nostre.
  Vietato copiare o tradurre alla lettera paragrafi del workbook. I nomi generici delle attività
  (es. "Verifica della qualità dei dati") non sono un problema; i testi descrittivi sì.
- **Marchi**: nell'interfaccia si scrive "compatibile con la metodologia CPMAI" e mai "workbook
  ufficiale PMI". Il nome dell'app sarà neutro (da decidere prima del rilascio pubblico).
- **Versione del template**: ogni iterazione registra la versione del template con cui è stata
  creata. Se il template cambia, le iterazioni esistenti restano leggibili.

## Gerarchia

```
Template (versione N)
└── Fase (6)
    └── Gruppo di task
        └── Task (con una guida parafrasata)
            └── Domanda (chiave stabile, tipo, testo, aiuto)
```

### Tipi di domanda

| Tipo | Uso | Valore salvato |
|---|---|---|
| `text` | Quasi tutte le domande aperte | testo libero |
| `go_no_go` | I 9 fattori della valutazione Go/No-Go | verdetto `go` / `maybe` / `no_go` + testo di motivazione |
| `multi_choice` | Identificazione dei pattern di AI (7 pattern) | lista di opzioni + testo |

### Chiavi delle domande

Le chiavi sono stabili, in inglese e puntate, per esempio `p1.objectives.problem`. Non si
rinominano mai dopo il rilascio, perché le risposte salvate le usano come riferimento.

## Inventario della struttura

Sono elencate solo le domande che l'utente deve compilare. L'ordine coincide con quello del
workbook; i titoli sono provvisori e verranno rifiniti nel file YAML della Fase 1.

### Fase I — Comprensione del business

| Gruppo | Task | Domande |
|---|---|---|
| Obiettivi di business | Obiettivi di business | Problema da risolvere con l'AI in questa iterazione |
| | Criteri di successo di business | Misure oggettive di successo |
| | Analisi costi-benefici | Budget di costo e tempo · ROI atteso |
| Requisiti cognitivi | Requisiti cognitivi | Perché serve una soluzione AI · Alternative non-AI e perché non bastano · Parti non cognitive del progetto · Alternative di automazione non cognitiva per questa iterazione |
| | Obiettivi cognitivi | Obiettivi cognitivi |
| | Risultati cognitivi | Risultati e traguardi cognitivi |
| | Criteri di successo dell'AI | Cosa deve fare l'AI meglio di un sistema non-AI |
| | Identificazione dei pattern | Pattern di AI di questa iterazione (`multi_choice` sui 7 pattern) |
| Valutazione della situazione | Requisiti di risorse | Vincoli di calendario · Risorse tecnologiche · Competenze |
| | Requisiti di calendario | Risorse di team · Altri vincoli |
| Prestazioni e funzionamento | Prestazioni accettabili del modello | Metriche richieste e sensibilità a falsi positivi e negativi |
| | KPI accettabili | KPI di business · KPI tecnologici |
| AI affidabile | Framework di AI affidabile | Framework adottato |
| | Considerazioni etiche | Danni potenziali e mitigazioni |
| | Modalità di fallimento | Gestione dei fallimenti · Rischi principali · Human-in-the-loop · Bias |
| | Conformità normativa | Leggi e regolamenti applicabili |
| | Trasparenza | Trasparenza sulle fonti dei dati · Trasparenza sui metodi di selezione |
| | Spiegabilità | Requisiti di spiegabilità |
| AI Go/No-Go | Fattibilità di business | 3 × `go_no_go`: problema chiaro · disponibilità a investire e cambiare · ROI sufficiente |
| | Fattibilità dei dati | 3 × `go_no_go`: dati che misurano ciò che serve · quantità e accesso · qualità |
| | Fattibilità di esecuzione | 3 × `go_no_go`: tecnologia e competenze · tempi di esecuzione · sensatezza del contesto d'uso |
| Piano di progetto | Piano di progetto | Piano (fasi, durate, risorse, dipendenze) · Strumenti e tecniche iniziali ¹ |

¹ Nel PDF queste pagine non hanno un campo compilabile, ma il workbook chiede comunque i contenuti:
nell'app sono domande `text`.

### Fase II — Comprensione dei dati

| Gruppo | Task | Domande |
|---|---|---|
| Raccolta iniziale | Raccolta dei dati | Elenco dei dati e posizione, problemi di accesso |
| | Descrizione dei dati | Natura e struttura dei dati, eventuali disallineamenti |
| | Esplorazione dei dati | Cosa è emerso dall'ispezione, sufficienza della quantità |
| Qualità dei dati | Verifica della qualità | Qualità attuale ed esigenze di preparazione |
| Dati per il modello | Dati di training, validazione e test | Esigenze specifiche e come garantirne la sufficienza |
| | Dati per modelli edge | Esigenze di dati da e verso i dispositivi edge |
| | Modelli preaddestrati e di terze parti | Modelli utilizzabili, accesso, eventuale fine-tuning |

### Fase III — Preparazione dei dati

| Gruppo | Task | Domande |
|---|---|---|
| Selezione | Selezione dei dati | Dati selezionati, metodo, esclusioni |
| Pulizia e arricchimento | Pulizia dei dati | Metodi di preparazione e pipeline dei dati |
| | Arricchimento e augmentation | Metodi di augmentation e modifiche alla pipeline |
| Etichettatura | Etichettatura dei dati | Metodo, costi e loro crescita, modifiche alla pipeline |

### Fase IV — Sviluppo del modello

| Gruppo | Task | Domande |
|---|---|---|
| Tecnica di modellazione | Algoritmo / tecnica | Algoritmo e approccio |
| | Metodi ensemble | Configurazione dell'ensemble |
| | AutoML | Strumenti e modalità d'uso |
| | Fine-tuning di modelli preaddestrati | Modelli e metodo di fine-tuning |
| | AI generativa | Approccio, costi e limiti dell'API · Prompt engineering · Chaining |
| Progetto di test | Progetto di test e validazione | Approccio contro overfitting e underfitting |
| Training | Training del modello | Risultati e output condivisibili |
| Iperparametri | Ottimizzazione degli iperparametri | Misure di fit e metodo di ottimizzazione |

### Fase V — Valutazione del modello

| Gruppo | Task | Domande |
|---|---|---|
| Valutazione dei risultati | Prestazioni del modello | Misure di valutazione (matrici di confusione, ROC…) |
| | Misurazione dei KPI | KPI di business rispetto alla Fase I · KPI tecnologici rispetto alla Fase I |
| | Approccio di iterazione | Come iterare e quali fasi rivedere |
| | Revisione del processo | Approvazioni e revisioni prima della produzione |

### Fase VI — Messa in esercizio

| Gruppo | Task | Domande |
|---|---|---|
| Piano di messa in esercizio | Piano | Modalità e luoghi di esercizio · Processi IT da seguire |
| | Scaffolding | Attività non-AI necessarie (sviluppo applicativo ecc.) |
| Monitoraggio e manutenzione | Piano di monitoraggio | Approccio e strumenti di monitoraggio continuo |
| | Governance del modello | Responsabili della governance e modalità di risposta |
| Prossima iterazione | Prossimi passi | Cosa fare nella prossima iterazione e con quali risorse |
| Report di progetto | Report finale | *(nessuna domanda: è il documento generato dall'app)* |
| | Revisione del progetto | Post-mortem: cosa è andato bene, cosa no, cosa migliorare |

In totale ci sono circa 65 domande `text`, 9 `go_no_go` e 1 `multi_choice`.

## Modello dei dati

```
users           id, email (unica), password_hash, display_name, is_active,
                email_verified_at, created_at
sessions        id (hash del token), user_id, created_at, expires_at, last_seen_at
projects        id, owner_id, name, client_name, description, created_at, archived_at
iterations      id, project_id, number, title, user_story, template_version,
                status (draft | completed), created_at, updated_at
answers         id, iteration_id, question_key, text, verdict (null | go | maybe | no_go),
                choices (JSON, null), updated_at, updated_by
                UNIQUE (iteration_id, question_key)
share_links     id, iteration_id, token_hash, created_by, created_at, expires_at, revoked_at
ai_usage        id, user_id, created_at, provider, model, action (suggest | refine),
                question_key, input_tokens, output_tokens
```

Note:

- La **definizione** del workbook (domande, testi) non sta nel DB ma in
  `backend/app/workbook/template_v1.yaml`, versionato nel repository. Nel DB vanno solo le
  risposte.
- Una nuova iterazione può partire **vuota** oppure come **copia** delle risposte
  dell'iterazione precedente, coerente con l'indicazione del workbook di fare una copia per ogni
  iterazione.
- I **token di condivisione** sono casuali (almeno 128 bit) e nel DB si salva solo il loro hash.
  Un link si può revocare e può avere una scadenza.
- Lo **storico delle revisioni** delle risposte (utile dopo l'adozione di proposte AI) è rinviato
  a una fase successiva: per ora si conserva solo l'ultimo valore.
