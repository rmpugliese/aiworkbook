import { Alert, Anchor, List, Table, Text } from '@mantine/core'
import { Link } from 'react-router'

import { APP_NAME } from '../../config'
import { LegalPage, Section, Value } from './LegalPage'

export function AiInfoPage() {
  return (
    <LegalPage title="Uso dell'intelligenza artificiale">
      {(site) => {
        const { ai } = site
        return (
          <>
            <Text>
              {APP_NAME} include un assistente basato su un modello linguistico di intelligenza
              artificiale. Questa pagina spiega che cosa fa, quando interviene, quali dati riceve e
              dove sono i server, e come si colloca rispetto alle norme europee e italiane
              sull'intelligenza artificiale.
            </Text>

            <Section title="1. Il servizio AI in uso">
              {!ai.available && (
                <Alert color="gray">
                  Al momento l'assistente non è attivo su questa installazione.
                </Alert>
              )}
              <Table.ScrollContainer minWidth={420}>
                <Table aria-label="Servizio AI in uso">
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Th w={200}>Fornitore</Table.Th>
                      <Table.Td>
                        <Value value={ai.provider_name} placeholder="fornitore" />
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Sede dei server</Table.Th>
                      <Table.Td>
                        <Value value={ai.server_location} placeholder="sede dei server" />
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Modello</Table.Th>
                      <Table.Td>{ai.model ?? '—'}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Tipo di modello</Table.Th>
                      <Table.Td>
                        <Value value={ai.model_kind} placeholder="tipo di modello" />
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              <Text>
                Usiamo servizi con server nell'Unione europea e modelli open source o "open weight",
                cioè con pesi pubblicati e verificabili, invece di modelli chiusi.
              </Text>
            </Section>

            <Section title="2. Che cosa fa">
              <Text>Su ogni domanda del workbook, solo se lo chiedi, l'assistente può:</Text>
              <List spacing="xs">
                <List.Item>
                  <b>Suggerire una bozza</b> di risposta a partire dal contesto del progetto;
                </List.Item>
                <List.Item>
                  <b>Migliorare il testo</b> già scritto (chiarezza, completezza, tono), senza
                  aggiungere fatti;
                </List.Item>
                <List.Item>
                  <b>Criticare</b> la risposta: lacune, incoerenze, domande da porsi.
                </List.Item>
              </List>
            </Section>

            <Section title="3. Quando interviene: sei tu a decidere">
              <List spacing="xs">
                <List.Item>
                  È <b>spento</b> su ogni progetto finché il proprietario non lo attiva, dopo aver
                  visto a quale servizio andranno i dati.
                </List.Item>
                <List.Item>
                  Parte <b>solo quando lo chiedi</b>, campo per campo; non lavora in background.
                </List.Item>
                <List.Item>
                  Le proposte sono <b>etichettate come generate dall'AI</b> e non modificano nulla
                  finché non scegli "Sostituisci" o "Aggiungi in fondo".
                </List.Item>
                <List.Item>Non prende decisioni: le valutazioni Go/No-Go restano tue.</List.Item>
              </List>
            </Section>

            <Section title="4. Quali dati riceve">
              <Text>
                Per rispondere con cognizione di causa, insieme alla domanda il servizio AI riceve:
                nome, cliente e descrizione del progetto, titolo e user story dell'iterazione, la
                guida del task, il testo attuale del campo, le altre risposte dell'iterazione (fino
                a circa 12.000 caratteri) e le eventuali indicazioni che scrivi per la richiesta.
                Non riceve la tua email, la password né dati di altri progetti.
              </Text>
              <Text>
                L'app conserva per 12 mesi solo i <b>metadati</b> di ogni richiesta (data, azione,
                modello, numero di caratteri, esito), mai i testi. I dati non sono usati per
                addestrare modelli da parte del titolare; per la conservazione presso il fornitore
                valgono le sue condizioni, scelte tra quelle che non usano i dati dei clienti per
                l'addestramento.
              </Text>
            </Section>

            <Section title="5. Limiti">
              <Text>
                I modelli linguistici possono produrre testi plausibili ma sbagliati, incompleti o
                non aggiornati. L'assistente non conosce il tuo cliente oltre a ciò che hai scritto
                e segnala con "[da verificare]" le ipotesi. Rileggi e verifica sempre le proposte:
                la responsabilità del contenuto finale resta tua.
              </Text>
            </Section>

            <Section title="6. Quadro normativo">
              <Text>Le norme di riferimento sono:</Text>
              <List spacing="xs">
                <List.Item>
                  il <b>Regolamento (UE) 2024/1689 sull'intelligenza artificiale</b> (AI Act), come
                  modificato dal Regolamento (UE) 2026/1744 (Digital Omnibus sull'IA);
                </List.Item>
                <List.Item>
                  la <b>legge 23 settembre 2025, n. 132</b>, sull'intelligenza artificiale, e i
                  relativi decreti attuativi;
                </List.Item>
                <List.Item>
                  il <b>Regolamento (UE) 2016/679</b> (GDPR) per i dati personali.
                </List.Item>
              </List>
              <Text>
                L'assistente è un sistema di AI a <b>rischio limitato</b>: aiuta a redigere testi e
                non prende decisioni su persone. Non è un sistema ad alto rischio (non valuta
                lavoratori, studenti, accesso al credito o a servizi essenziali) e non svolge
                pratiche vietate. L'app non sviluppa modelli propri: usa modelli per finalità
                generali di terzi, i cui obblighi specifici spettano ai rispettivi fornitori.
              </Text>
              <Text>Per gli obblighi che riguardano questo tipo di sistemi:</Text>
              <List spacing="xs">
                <List.Item>
                  <b>Trasparenza</b>: questa pagina, l'avviso al momento dell'attivazione e
                  l'etichetta "Generato dall'AI · da verificare" su ogni proposta.
                </List.Item>
                <List.Item>
                  <b>Supervisione umana</b>: nessun testo entra in una risposta senza la tua
                  conferma, e puoi modificarlo o scartarlo.
                </List.Item>
                <List.Item>
                  <b>Contenuti generati</b>: il PDF e la pagina condivisa di un'iterazione redatta
                  con l'assistente lo dichiarano in copertina.
                </List.Item>
                <List.Item>
                  <b>Alfabetizzazione</b>: funzioni, dati trattati e limiti sono spiegati qui, in
                  linguaggio non tecnico.
                </List.Item>
              </List>
              <Text size="sm" c="dimmed">
                Autorità di riferimento in Italia: Agenzia per la cybersicurezza nazionale (ACN) e
                Agenzia per l'Italia digitale (AgID) per l'intelligenza artificiale; Garante per la
                protezione dei dati personali per il trattamento dei dati.
              </Text>
            </Section>

            <Section title="7. Se usi l'app per la tua attività professionale">
              <Alert color="violet" variant="light">
                <Text size="sm">
                  La legge n. 132/2025 (art. 13) prevede che nelle professioni intellettuali
                  l'intelligenza artificiale sia usata solo come <b>supporto</b>, con prevalenza del
                  lavoro del professionista, e che il professionista <b>informi il cliente</b> dei
                  sistemi di AI utilizzati, in modo chiaro e semplice. Se usi l'assistente per il
                  lavoro di un cliente, comunicaglielo: il PDF e la pagina condivisa lo indicano già
                  in copertina, e questa pagina descrive il servizio usato.
                </Text>
              </Alert>
            </Section>

            <Section title="8. Altre informazioni">
              <Text>
                Per i dati personali vedi l'
                <Anchor component={Link} to="/privacy">
                  informativa sulla privacy
                </Anchor>
                ; per le condizioni d'uso dell'assistente, i{' '}
                <Anchor component={Link} to="/terms">
                  termini d'uso
                </Anchor>
                .
              </Text>
            </Section>
          </>
        )
      }}
    </LegalPage>
  )
}
