import { Anchor, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { Link } from 'react-router'

import { CookieTable } from './CookieTable'

/** The footer's "Cookie" entry: which cookies the app uses, all strictly necessary. */
export function CookiePanel() {
  const [opened, setOpened] = useState(false)

  return (
    <>
      <Anchor component="button" type="button" size="xs" c="dimmed" onClick={() => setOpened(true)}>
        Cookie
      </Anchor>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Cookie" size="lg">
        <Stack>
          <Text size="sm">
            Questa app usa solo cookie tecnici, necessari per l'accesso e la sicurezza. Nessun
            cookie di profilazione, di statistica o di terze parti: per questo non ti chiediamo il
            consenso.
          </Text>
          <CookieTable />
          <Group justify="space-between">
            <Anchor component={Link} to="/cookies" size="sm" onClick={() => setOpened(false)}>
              Leggi la cookie policy completa
            </Anchor>
            <Button onClick={() => setOpened(false)}>Ho capito</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
