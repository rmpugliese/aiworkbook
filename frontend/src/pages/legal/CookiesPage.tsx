import { Anchor, List, Text } from '@mantine/core'
import { Link } from 'react-router'

import { CookieTable } from '../../components/CookieTable'
import { APP_NAME } from '../../config'
import { Controller, LegalPage, Section } from './LegalPage'

export function CookiesPage() {
  return (
    <LegalPage title="Cookie policy">
      {(site) => (
        <>
          <Text>
            Questa pagina spiega quali cookie usa {APP_NAME}, secondo le Linee guida del Garante per
            la protezione dei dati personali sui cookie (giugno 2021).
          </Text>

          <Section title="1. Solo cookie tecnici">
            <Text>
              L'app usa esclusivamente <b>cookie tecnici</b>, indispensabili per farla funzionare in
              modo sicuro: tenerti collegato e proteggere i tuoi dati. Per questo non serve il tuo
              consenso e non trovi un banner per i cookie.
            </Text>
            <List spacing="xs">
              <List.Item>Nessun cookie di profilazione o pubblicitario.</List.Item>
              <List.Item>Nessun cookie di statistica o di analisi del traffico.</List.Item>
              <List.Item>
                Nessun cookie di terze parti: l'app non carica script, caratteri, mappe o video da
                altri siti.
              </List.Item>
            </List>
          </Section>

          <Section title="2. I cookie che usiamo">
            <CookieTable />
            <Text size="sm" c="dimmed">
              "Secure": inviati solo su connessione cifrata. "HttpOnly": non leggibili dal codice
              delle pagine. "SameSite=Lax": non inviati da richieste che partono da altri siti.
            </Text>
          </Section>

          <Section title="3. Pagine condivise con i clienti">
            <Text>
              Le pagine aperte con un link condiviso non impostano cookie: chi le consulta non
              lascia traccia nel browser.
            </Text>
          </Section>

          <Section title="4. Come gestirli">
            <Text>
              Puoi cancellare o bloccare i cookie dalle impostazioni del browser. Bloccando i cookie
              tecnici l'accesso all'app non funziona; le pagine pubbliche (informative, link
              condivisi) restano consultabili.
            </Text>
          </Section>

          <Section title="5. Titolare">
            <Controller site={site} />
            <Text>
              Per tutto il resto sul trattamento dei dati vedi l'
              <Anchor component={Link} to="/privacy">
                informativa sulla privacy
              </Anchor>
              .
            </Text>
          </Section>
        </>
      )}
    </LegalPage>
  )
}
