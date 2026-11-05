import { Anchor, List, Text } from '@mantine/core'
import { Link } from 'react-router'

import { APP_NAME } from '../../config'
import { Controller, LegalPage, Section, Value } from './LegalPage'

export function TermsPage() {
  return (
    <LegalPage title="Termini d'uso">
      {(site) => (
        <>
          <Text>
            Questi termini regolano l'uso di {APP_NAME} (di seguito "l'app"). Registrandoti li
            accetti. L'app è offerta da:
          </Text>
          <Controller site={site} />

          <Section title="1. Un servizio sperimentale">
            <Text>
              L'app è un <b>servizio sperimentale</b>, offerto gratuitamente e <b>"così com'è"</b>{' '}
              ("as is"): può contenere errori, cambiare, essere sospeso o interrotto in qualsiasi
              momento. Usala come supporto al tuo lavoro, non come unico strumento per decisioni
              importanti, e conserva una copia dei documenti che ti servono (PDF o esportazione del
              progetto).
            </Text>
          </Section>

          <Section title="2. Gratuità e possibili funzioni a pagamento">
            <Text>
              Oggi l'app è <b>gratuita</b>. Mantenerla ha però dei costi (server, servizio di
              intelligenza artificiale, manutenzione): se diventassero non sostenibili, il fornitore
              potrà introdurre <b>piani a pagamento</b> o <b>limiti di utilizzo</b>, per esempio per
              la personalizzazione dei documenti con il proprio marchio, per l'assistente AI, per il
              numero di progetti o di collaboratori. In questo caso:
            </Text>
            <List spacing="xs">
              <List.Item>
                le nuove condizioni saranno comunicate con almeno <b>30 giorni di anticipo</b>, via
                email e nell'app, e dovrai accettarle prima di continuare;
              </List.Item>
              <List.Item>
                <b>nessun addebito automatico</b>: una funzione a pagamento si attiva solo con una
                tua scelta esplicita;
              </List.Item>
              <List.Item>
                l'<b>esportazione dei tuoi progetti e dei tuoi dati</b> resterà sempre disponibile e
                gratuita, così potrai portarli via in qualsiasi momento.
              </List.Item>
            </List>
          </Section>

          <Section title="3. Il servizio">
            <Text>
              L'app aiuta a documentare progetti di intelligenza artificiale con una struttura
              compatibile con la metodologia CPMAI: progetti, iterazioni, domande del workbook,
              valutazioni Go/No-Go, documenti PDF, condivisione in sola lettura e un assistente AI
              facoltativo. L'app non è affiliata né approvata dal Project Management Institute
              (PMI); CPMAI e PMI sono marchi dei rispettivi titolari, citati solo in modo
              descrittivo.
            </Text>
          </Section>

          <Section title="4. Il tuo account">
            <List spacing="xs">
              <List.Item>Devi indicare un indirizzo email valido e confermarlo.</List.Item>
              <List.Item>
                Sei responsabile della riservatezza della password e di ciò che avviene con il tuo
                account.
              </List.Item>
              <List.Item>
                Puoi scaricare i tuoi dati ed eliminare l'account in qualsiasi momento dal profilo.
              </List.Item>
            </List>
          </Section>

          <Section title="5. I tuoi contenuti">
            <Text>
              Ciò che inserisci resta tuo. Al fornitore concedi solo i diritti necessari a
              conservarlo, mostrarlo a te e alle persone con cui lo condividi e trasformarlo nei
              documenti che richiedi. Sei responsabile di avere il diritto di inserire i dati dei
              tuoi clienti e di rispettare gli accordi di riservatezza con loro; per i loro dati
              personali il fornitore agisce come responsabile del trattamento per tuo conto, come
              descritto nell'
              <Anchor component={Link} to="/privacy">
                informativa sulla privacy
              </Anchor>
              .
            </Text>
          </Section>

          <Section title="6. Assistente AI">
            <Text>
              L'assistente è facoltativo e interviene solo quando lo chiedi, nei progetti in cui lo
              hai attivato. Le sue proposte sono generate automaticamente e possono essere
              imprecise, incomplete o sbagliate: verificale sempre prima di usarle. Nessun testo
              viene modificato senza la tua conferma e la responsabilità di ciò che decidi di usare
              resta tua. Come funziona e dove vanno i dati è spiegato nella pagina{' '}
              <Anchor component={Link} to="/ai">
                Uso dell'AI
              </Anchor>
              .
            </Text>
          </Section>

          <Section title="7. Link condivisi e collaboratori">
            <Text>
              Chi riceve un link condiviso vede l'iterazione senza account. Sei tu a decidere a chi
              inviarlo e puoi revocarlo in qualsiasi momento.
            </Text>
            <Text>
              Puoi invitare dei colleghi come <b>collaboratori</b> di un tuo progetto (oggi fino a
              cinque per progetto): vedono e modificano il workbook, scaricano i documenti e usano
              l'assistente se lo hai attivato. Il progetto resta tuo: solo tu lo modifichi, archivi
              o elimini, gestisci i link pubblici e i collaboratori, che puoi rimuovere in qualsiasi
              momento. Sei responsabile di chi inviti e di avere il diritto di condividere con loro
              i dati dei tuoi clienti. Se sei invitato in un progetto altrui, usa i suoi contenuti
              solo per quel lavoro e rispetta gli accordi di riservatezza del proprietario; puoi
              lasciare il progetto quando vuoi.
            </Text>
          </Section>

          <Section title="8. Uso corretto">
            <Text>
              Non usare l'app per attività illecite, per inserire contenuti che violano diritti di
              terzi, per tentare di accedere a dati altrui o per sovraccaricare il servizio. Non
              usarla, né usare l'assistente, per pratiche vietate dal Regolamento (UE) 2024/1689 o
              come sistema che prende o determina decisioni ad alto rischio su persone (per esempio
              selezione del personale, accesso al credito o a servizi essenziali): l'app è uno
              strumento di documentazione dei progetti, non un sistema decisionale. In caso di
              violazioni l'account può essere sospeso.
            </Text>
          </Section>

          <Section title="9. Nessuna garanzia e limitazione di responsabilità">
            <Text>
              Nella misura massima consentita dalla legge, il servizio è fornito senza garanzie di
              alcun tipo, espresse o implicite, comprese quelle di funzionamento ininterrotto,
              assenza di errori, conservazione dei dati, idoneità a uno scopo particolare o
              correttezza dei risultati, anche di quelli prodotti dall'assistente AI. Il fornitore
              non risponde di danni diretti o indiretti, perdita di dati, di profitti o di
              opportunità derivanti dall'uso o dall'impossibilità di usare l'app. Restano fermi i
              casi di dolo o colpa grave e i diritti che la legge riconosce ai consumatori e che non
              possono essere limitati.
            </Text>
          </Section>

          <Section title="10. Modifiche e interruzione">
            <Text>
              I termini possono cambiare: le modifiche sostanziali ti saranno presentate al primo
              accesso successivo e potrai accettarle o eliminare l'account. Il servizio può essere
              interrotto; quando possibile, ne verrà dato avviso con un anticipo ragionevole per
              permetterti di scaricare i tuoi dati.
            </Text>
          </Section>

          <Section title="11. Legge applicabile e contatti">
            <Text>
              Questi termini sono regolati dalla legge italiana. Foro competente:{' '}
              <Value value={site.legal.court} placeholder="foro" />, salvo il foro del consumatore
              quando previsto dalla legge. Per informazioni:{' '}
              <Value value={site.legal.contact_email} placeholder="email" />.
            </Text>
          </Section>
        </>
      )}
    </LegalPage>
  )
}
