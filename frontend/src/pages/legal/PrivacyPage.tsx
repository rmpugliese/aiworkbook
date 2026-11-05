import { Anchor, List, Text } from '@mantine/core'
import { Link } from 'react-router'

import { APP_NAME } from '../../config'
import { Controller, LegalPage, Section, Value } from './LegalPage'

export function PrivacyPage() {
  return (
    <LegalPage title="Informativa sulla privacy">
      {(site) => (
        <>
          <Text>
            Questa informativa spiega quali dati personali tratta {APP_NAME} (di seguito "l'app"),
            per quali scopi, per quanto tempo e quali diritti hai, ai sensi del Regolamento (UE)
            2016/679 (GDPR).
          </Text>

          <Section title="1. Titolare del trattamento">
            <Controller site={site} />
          </Section>

          <Section title="2. Quali dati trattiamo">
            <List spacing="xs">
              <List.Item>
                <b>Account</b>: email, nome visualizzato, password (conservata solo come impronta
                crittografica, mai in chiaro), date di registrazione e di conferma, accettazione dei
                termini; se accedi con Google, l'identificativo e l'email forniti da Google.
              </List.Item>
              <List.Item>
                <b>Contenuti che inserisci</b>: progetti, nomi dei clienti, descrizioni, user story,
                risposte del workbook, valutazioni Go/No-Go.
              </List.Item>
              <List.Item>
                <b>Dati tecnici</b>: sessioni di accesso (data di creazione e di ultimo utilizzo) e
                un registro delle richieste (data, indirizzo della pagina, esito, durata,
                identificativo dell'utente). Gli indirizzi IP sono usati solo in memoria per
                limitare gli abusi e non vengono conservati.
              </List.Item>
              <List.Item>
                <b>Assistente AI</b>: per ogni richiesta solo metadati (azione, modello, numero di
                caratteri, esito), mai i testi inviati o ricevuti.
              </List.Item>
              <List.Item>
                <b>Link condivisi</b>: etichetta, scadenza, numero e data degli accessi; il link
                stesso è conservato solo come impronta crittografica.
              </List.Item>
              <List.Item>
                <b>Collaborazione</b>: l'email dei colleghi che inviti in un progetto, chi li ha
                invitati e quando, e chi ha modificato per ultimo ogni risposta.
              </List.Item>
            </List>
          </Section>

          <Section title="3. Finalità e basi giuridiche">
            <List spacing="xs">
              <List.Item>
                Fornire il servizio (account, progetti, documenti, condivisione) e inviare le email
                necessarie (conferma dell'indirizzo, recupero della password): esecuzione del
                contratto, cioè dei termini d'uso (art. 6.1.b GDPR).
              </List.Item>
              <List.Item>
                Sicurezza del servizio e prevenzione degli abusi (registri tecnici, limiti di
                utilizzo): legittimo interesse del titolare (art. 6.1.f GDPR).
              </List.Item>
              <List.Item>
                Assistente AI: solo nei progetti in cui lo attivi e solo quando lo usi; vedi la
                pagina{' '}
                <Anchor component={Link} to="/ai">
                  Uso dell'AI
                </Anchor>
                .
              </List.Item>
            </List>
            <Text>
              Non usiamo i dati per pubblicità, profilazione, vendita a terzi o addestramento di
              modelli di intelligenza artificiale.
            </Text>
          </Section>

          <Section title="4. Dati dei tuoi clienti">
            <Text>
              Se nei progetti inserisci informazioni sui tuoi clienti, sei tu il titolare di quei
              dati e devi avere una base giuridica per trattarli; per quei contenuti il titolare
              dell'app agisce come responsabile del trattamento per tuo conto (art. 28 GDPR). Evita
              di inserire categorie particolari di dati (salute, opinioni politiche, ecc.) se non
              strettamente necessario. Se inviti dei colleghi in un progetto, sei tu a decidere di
              condividere con loro quei contenuti.
            </Text>
          </Section>

          <Section title="5. Destinatari e luogo del trattamento">
            <List spacing="xs">
              <List.Item>
                Fornitore del server su cui gira l'app e il suo database (Unione europea).
              </List.Item>
              <List.Item>
                Fornitore della casella email da cui partono i messaggi dell'app.
              </List.Item>
              <List.Item>Google, solo se scegli di accedere con Google.</List.Item>
              <List.Item>
                Il fornitore del servizio AI (
                <Value value={site.ai.provider_name} placeholder="fornitore AI" />, server in{' '}
                <Value value={site.ai.server_location} placeholder="sede dei server" />
                ), solo se attivi e usi l'assistente.
              </List.Item>
              <List.Item>
                Le persone a cui invii un link condiviso, che vedono l'iterazione in sola lettura.
              </List.Item>
              <List.Item>
                I colleghi che inviti come collaboratori di un progetto: vedono e modificano il
                progetto e vedono nome ed email del proprietario e degli altri collaboratori. Se sei
                tu a essere invitato, il proprietario e gli altri collaboratori vedono il tuo nome e
                la tua email, e chi ha modificato ogni risposta.
              </List.Item>
            </List>
            <Text>
              I dati sono conservati nell'Unione europea e non vengono trasferiti fuori dallo Spazio
              economico europeo, salvo l'accesso con Google se lo scegli.
            </Text>
          </Section>

          <Section title="6. Per quanto tempo">
            <List spacing="xs">
              <List.Item>Account e contenuti: finché non elimini l'account.</List.Item>
              <List.Item>
                Inviti a collaborare: finché il collaboratore resta nel progetto, o finché il
                progetto o uno dei due account non viene eliminato.
              </List.Item>
              <List.Item>Sessioni: 30 giorni dall'ultimo utilizzo.</List.Item>
              <List.Item>
                Link di conferma e di recupero della password: fino all'uso o alla scadenza.
              </List.Item>
              <List.Item>Registro delle richieste all'assistente AI: 12 mesi.</List.Item>
              <List.Item>Copie di sicurezza del database: 14 giorni.</List.Item>
            </List>
          </Section>

          <Section title="7. I tuoi diritti">
            <Text>
              Puoi accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento,
              opporti e riceverli in un formato leggibile da macchina (artt. 15–22 GDPR). Nella
              pagina "Profilo" puoi scaricare tutti i tuoi dati ed eliminare l'account in autonomia;
              per il resto scrivi a <Value value={site.legal.email} placeholder="email privacy" />.
              Hai anche il diritto di proporre reclamo al Garante per la protezione dei dati
              personali (www.garanteprivacy.it).
            </Text>
          </Section>

          <Section title="8. Cookie">
            <Text>
              L'app usa solo cookie tecnici, necessari al funzionamento: nessun cookie di
              profilazione o di terze parti. I dettagli sono nella{' '}
              <Anchor component={Link} to="/cookies">
                cookie policy
              </Anchor>
              .
            </Text>
          </Section>

          <Section title="9. Sicurezza e modifiche">
            <Text>
              Le comunicazioni sono cifrate (HTTPS), password e link sono conservati solo come
              impronte crittografiche e i progetti sono visibili solo al loro proprietario e ai
              collaboratori che invita. Se questa informativa cambia in modo sostanziale, ti
              chiederemo di prenderne visione al primo accesso successivo.
            </Text>
          </Section>
        </>
      )}
    </LegalPage>
  )
}
