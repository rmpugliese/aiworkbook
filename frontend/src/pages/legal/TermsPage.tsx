import { List, Text } from '@mantine/core'

import { APP_NAME } from '../../config'
import { LegalPage, Section } from './LegalPage'

export function TermsPage() {
  return (
    <LegalPage title="Termini d'uso">
      <Text>
        Questi termini regolano l'uso di {APP_NAME} (di seguito "l'app"), offerta da [NOME O RAGIONE
        SOCIALE DEL TITOLARE] (di seguito "il fornitore"). Registrandoti li accetti.
      </Text>

      <Section title="1. Il servizio">
        <Text>
          L'app aiuta a documentare progetti di intelligenza artificiale seguendo una struttura
          compatibile con la metodologia CPMAI: progetti, iterazioni, domande del workbook,
          valutazioni Go/No-Go, documenti PDF, condivisione in sola lettura e un assistente AI
          facoltativo. Il servizio è attualmente gratuito. L'app non è affiliata né approvata dal
          Project Management Institute (PMI); CPMAI e PMI sono marchi dei rispettivi titolari e sono
          citati solo in modo descrittivo.
        </Text>
      </Section>

      <Section title="2. Il tuo account">
        <List spacing="xs">
          <List.Item>Devi indicare un indirizzo email valido e confermarlo.</List.Item>
          <List.Item>
            Sei responsabile della riservatezza della password e di ciò che avviene con il tuo
            account.
          </List.Item>
          <List.Item>Puoi eliminare l'account in qualsiasi momento dal profilo.</List.Item>
        </List>
      </Section>

      <Section title="3. I tuoi contenuti">
        <Text>
          Ciò che inserisci resta tuo. Ci concedi solo i diritti necessari a conservarlo, mostrarlo
          a te e alle persone con cui lo condividi, e trasformarlo nei documenti che richiedi. Sei
          responsabile di avere il diritto di inserire i dati dei tuoi clienti e di rispettare gli
          accordi di riservatezza con loro. Per i dati personali dei tuoi clienti il fornitore
          agisce come responsabile del trattamento per tuo conto, secondo l'informativa sulla
          privacy; [UN ACCORDO DI RESPONSABILE DEL TRATTAMENTO (ART. 28 GDPR) È DISPONIBILE SU
          RICHIESTA / ALLEGATO].
        </Text>
      </Section>

      <Section title="4. Assistente AI">
        <Text>
          Le proposte dell'assistente sono generate automaticamente e possono essere imprecise:
          verificale sempre prima di usarle. Nessun testo viene modificato senza la tua conferma.
          L'assistente invia contenuti al servizio AI configurato solo sui progetti in cui lo
          attivi. Il suo uso può essere limitato per evitare abusi.
        </Text>
      </Section>

      <Section title="5. Link condivisi">
        <Text>
          Chi riceve un link condiviso vede l'iterazione senza account. Sei tu a decidere a chi
          inviarlo; puoi revocarlo in qualsiasi momento.
        </Text>
      </Section>

      <Section title="6. Uso corretto">
        <Text>
          Non usare l'app per attività illecite, per inserire contenuti che violano diritti di
          terzi, per tentare di accedere a dati altrui o per sovraccaricare il servizio. In caso di
          violazioni il fornitore può sospendere l'account.
        </Text>
      </Section>

      <Section title="7. Disponibilità e responsabilità">
        <Text>
          Il servizio è offerto "così com'è", senza garanzia di disponibilità continua. Il fornitore
          esegue copie di sicurezza periodiche ma ti invita a scaricare i documenti importanti. Nei
          limiti consentiti dalla legge, il fornitore non risponde di danni indiretti o della
          perdita di dati dovuta a cause al di fuori del suo ragionevole controllo. [DA ADATTARE:
          NEI CONFRONTI DEI CONSUMATORI RESTANO FERMI I DIRITTI INDEROGABILI.]
        </Text>
      </Section>

      <Section title="8. Modifiche e recesso">
        <Text>
          I termini possono cambiare: le modifiche sostanziali ti saranno presentate al primo
          accesso successivo e potrai accettarle o eliminare l'account. Il fornitore può
          interrompere il servizio con un preavviso di almeno [30] giorni, durante i quali potrai
          scaricare i tuoi dati.
        </Text>
      </Section>

      <Section title="9. Legge applicabile">
        <Text>
          Questi termini sono regolati dalla legge italiana. Foro competente: [FORO], salvo il foro
          del consumatore quando previsto dalla legge. Contatti: [EMAIL DI CONTATTO].
        </Text>
      </Section>
    </LegalPage>
  )
}
