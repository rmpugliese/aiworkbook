import { Alert, Anchor, Card, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** The version users accept; it must match TERMS_VERSION in backend/app/legal.py. */
export const TERMS_VERSION_LABEL = '9 ottobre 2026'

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="lg" py="xl" maw={820} mx="auto">
      <div>
        <Title order={1}>{title}</Title>
        <Text c="dimmed">Versione del {TERMS_VERSION_LABEL}</Text>
      </div>
      {/* Remove once a lawyer has reviewed the texts and the placeholders are filled in. */}
      <Alert color="yellow" icon={<IconAlertTriangle size={18} />} title="Bozza">
        Testo provvisorio, da completare con i dati del titolare (tra parentesi quadre) e da far
        verificare da un legale prima dell'apertura al pubblico.
      </Alert>
      <Card>
        <Stack gap="lg">{children}</Stack>
      </Card>
      <Text size="sm" c="dimmed">
        Vedi anche:{' '}
        <Anchor component={Link} to="/privacy">
          Informativa sulla privacy
        </Anchor>{' '}
        ·{' '}
        <Anchor component={Link} to="/terms">
          Termini d'uso
        </Anchor>
      </Text>
    </Stack>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="xs" component="section">
      <Title order={3}>{title}</Title>
      {children}
    </Stack>
  )
}
