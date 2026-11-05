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
              dove sono i server, in linea con il Regolamento (UE) 2024/1689 sull'intelligenza
              artificiale (AI Act) e con il GDPR.
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
                guida del task, il testo attuale del campo e le altre risposte dell'iterazione (fino
                a circa 12.000 caratteri). Non riceve la tua email, la password né dati di altri
                progetti.
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

            <Section title="6. Altre informazioni">
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
