# Requirements: Fase 4 — Valutazione Go/No-Go

## Scope

Completare i Go/No-Go: l'esito della Fase I calcolato dai 9 fattori, i Go/No-Go di fine fase con
checklist e fase di ritorno, il riepilogo e lo stato delle fasi nell'indice.

### Regole di calcolo (funzioni pure nel frontend)

| Regola | Definizione |
|---|---|
| **Esito suggerito della Fase I** | Solo quando tutti i 9 fattori hanno un verdetto: un NO-GO qualsiasi → NO-GO; altrimenti un MAYBE qualsiasi → MAYBE; altrimenti GO. Con fattori mancanti: "da completare (n di 9)" |
| **Verdetto suggerito, Fasi II–VI** | Tutti i criteri spuntati → GO; mancano solo criteri senza fase di ritorno → MAYBE (si risolve nella fase); manca almeno un criterio con fase di ritorno → NO-GO |
| **Fase di ritorno suggerita** | Tra i criteri non spuntati, la fase di ritorno **più a monte** (il numero più basso); nessuna se nessun criterio non spuntato ne indica una |
| **Stato di una fase** | Il verdetto salvato nel suo Go/No-Go di fase; "da valutare" se manca |

### Go/No-Go di fase (Fasi II–VI)

- Checklist dei criteri, salvata in `choices` come elenco dei criteri soddisfatti.
- Riquadro con il suggerimento dell'app: verdetto e, se serve, fase di ritorno con il motivo
  (i criteri mancanti che la indicano).
- Verdetto GO / MAYBE / NO-GO scelto dall'utente.
- **Fase di ritorno** selezionabile solo con verdetto MAYBE o NO-GO, tra le fasi precedenti; si
  azzera scegliendo GO.
- Motivazione.

### Esito della Fase I

- Matrice 3×3 (business, dati, esecuzione) con il verdetto di ogni fattore e il collegamento al
  task del fattore.
- Esito suggerito e verdetto scelto dall'utente, con motivazione; nessuna fase di ritorno.

### Scostamento dal suggerimento

Se il verdetto (o la fase di ritorno) scelto dall'utente è diverso da quello suggerito, l'app lo
evidenzia e chiede la motivazione; finché la motivazione è vuota l'avviso resta in evidenza.
Il salvataggio non viene bloccato: la decisione è dell'utente.

### Riepilogo Go/No-Go

- Voce "Riepilogo Go/No-Go" in cima all'indice dell'iterazione (`?task=summary`).
- Matrice 3×3 della Fase I con l'esito suggerito e quello scelto.
- Tabella delle 6 fasi: stato, fase di ritorno, motivazione (abbreviata) e collegamento al
  Go/No-Go della fase.

### Indice

Accanto al nome di ogni fase, oltre all'avanzamento, compare lo stato (GO, MAYBE, NO-GO o
nessun segno se da valutare).

### Backend

Una regola in più nella validazione delle risposte: `return_to_phase` è ammesso solo con verdetto
MAYBE o NO-GO.

### Escluso

- Blocco della navigazione verso le fasi successive in caso di NO-GO (l'utente resta libero)
- Storico delle decisioni Go/No-Go tra un'iterazione e l'altra

## Decisions

- **Riepilogo dedicato + stato nell'indice**.
- **Scostamento ammesso con motivazione**: suggerimenti evidenti, decisione dell'utente.
- **Fase di ritorno più a monte** quando i criteri mancanti indicano fasi diverse: si cerca la
  causa alla radice, come suggerisce la metodologia.
- **Regole nel frontend**: sono suggerimenti di interfaccia e non servono al server; il server
  continua a validare solo la coerenza dei dati.

## Context

- Le risposte salvate nella Fase 3 (verdetto e motivazione) restano valide: la checklist e la fase
  di ritorno si aggiungono senza migrazioni.
- Testi in italiano; i colori dei verdetti sono gli stessi ovunque (GO verde, MAYBE giallo, NO-GO
  rosso).
