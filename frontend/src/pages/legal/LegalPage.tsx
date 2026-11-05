import { Alert, Anchor, Card, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { useSite, type Site } from '../../api/site'
import { LEGAL_LINKS, TERMS_VERSION_LABEL } from './links'

/** A legal page: title, draft notice until a lawyer has reviewed the texts, then the content. */
export function LegalPage({
  title,
  children,
}: {
  title: string
  children: (site: Site) => ReactNode
}) {
  const site = useSite()

  return (
    <Stack gap="lg" py="xl" maw={820} mx="auto">
      <div>
        <Title order={1}>{title}</Title>
        <Text c="dimmed">Versione del {TERMS_VERSION_LABEL}</Text>
      </div>
      {site.data && !site.data.legal.reviewed && (
        <Alert color="yellow" icon={<IconAlertTriangle size={18} />} title="Bozza">
          Testo in attesa di revisione legale.
        </Alert>
      )}
      {site.isPending && <Loader />}
      {site.isError && <Alert color="red">{site.error.message}</Alert>}
      {site.data && (
        <Card>
          <Stack gap="lg">{children(site.data)}</Stack>
        </Card>
      )}
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          Vedi anche:
        </Text>
        {LEGAL_LINKS.map((link) => (
          <Anchor key={link.to} component={Link} to={link.to} size="sm">
            {link.label}
          </Anchor>
        ))}
      </Group>
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

/** A detail from the administration, or a visible placeholder while it is missing. */
export function Value({ value, placeholder }: { value: string; placeholder: string }) {
  return value ? (
    <>{value}</>
  ) : (
    <Text span c="orange.8" fw={500}>
      [{placeholder}]
    </Text>
  )
}

/** "Name, address, VAT ID, email, PEC": the data controller, as configured. */
export function Controller({ site }: { site: Site }) {
  const { legal } = site
  return (
    <Text>
      <b>
        <Value value={legal.name} placeholder="titolare" />
      </b>
      , <Value value={legal.address} placeholder="indirizzo" />
      {legal.vat_id && <>, P. IVA / C.F. {legal.vat_id}</>}. Email:{' '}
      <Value value={legal.email} placeholder="email privacy" />
      {legal.pec && <>, PEC: {legal.pec}</>}.
    </Text>
  )
}
