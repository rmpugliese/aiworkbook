# Mission

Un'applicazione web che guida chi gestisce un progetto di intelligenza artificiale a documentarlo
passo dopo passo secondo la metodologia CPMAI, sostituendo il workbook PDF con uno strumento
strutturato, persistente, condivisibile e assistito dall'AI.

## Il problema

La metodologia CPMAI prevede la compilazione di un workbook (97 pagine, 6 fasi, circa 60 domande
aperte e 9 valutazioni Go/No-Go) per **ogni iterazione** di **ogni progetto**. Il PDF compilabile:

- non conserva la storia delle iterazioni se non duplicando file a mano;
- non si presta alla collaborazione né alla condivisione controllata con il cliente;
- non offre aiuto nella stesura: il consulente parte sempre da un campo vuoto;
- non produce un documento finale presentabile.

## La soluzione

- **Fedeltà alla metodologia**: la struttura dell'app ricalca fasi, gruppi di task, task e domande
  del workbook, nello stesso ordine, con le stesse valutazioni GO / MAYBE / NO-GO.
- **Progetti e iterazioni**: ogni utente gestisce più progetti; ogni progetto ha una o più
  iterazioni, ognuna equivalente a una "copia del workbook".
- **Persistenza**: ogni risposta è salvata in un database, automaticamente, mentre si scrive.
- **Documento generato**: da ogni iterazione si genera un documento (DOCX/PDF) ordinato e leggibile.
- **Condivisione in sola lettura**: il consulente può far vedere la valutazione all'azienda cliente
  senza darle permessi di modifica.
- **AI su richiesta**: l'AI non compila al posto dell'utente se l'utente non lo chiede. Può
  suggerire una bozza partendo dal contesto del progetto, oppure rifinire un testo già scritto
  (chiarezza, completezza, tono professionale). Ogni proposta va accettata esplicitamente.

## Pubblico

1. **Primo utente**: il fondatore, consulente certificato PMI-CPMAI, che usa l'app sui propri
   progetti.
2. **Consulenti e project manager AI**: dopo il rilascio pubblico, inizialmente gratuito.
3. **Aziende clienti**: lettori dei progetti condivisi con loro, senza account obbligatorio.

## Principi

- **La metodologia guida, l'app non inventa**: niente campi o passaggi che il workbook non preveda,
  salvo le funzioni di servizio (progetti, condivisione, export).
- **Testi originali, non copiati**: domande e guide sono **parafrasate** in italiano con parole
  nostre. L'app non riproduce il testo del workbook © PMI, e non usa i marchi PMI e CPMAI se non
  in modo descrittivo ("compatibile con la metodologia CPMAI"). Vedi `specs/workbook-model.md`.
- **L'utente resta autore**: l'AI propone, l'utente decide. Nessun testo viene sovrascritto senza
  conferma.
- **Dati del cliente riservati**: i contenuti dei progetti sono dati sensibili del cliente. Sono
  visibili solo al proprietario e a chi ha un link di condivisione valido, e non vengono usati per
  altri scopi.
- **Interfaccia in italiano**: l'interfaccia e i documenti generati sono in italiano.

## Cosa significa successo

- Il fondatore compila un'intera iterazione reale nell'app invece che nel PDF, e la consegna al
  cliente come documento generato o come link in sola lettura.
- Un consulente esterno si registra, crea un progetto e arriva al Go/No-Go della Fase I senza
  bisogno di istruzioni.
- Il costo dell'AI per utente resta sotto controllo grazie ai limiti d'uso.
