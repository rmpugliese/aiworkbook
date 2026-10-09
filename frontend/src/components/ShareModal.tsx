import {
  Alert,
  Badge,
  Button,
  CopyButton,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useState, type FormEvent } from 'react'

import {
  useCreateShareLink,
  useDeleteShareLink,
  useRevokeShareLink,
  useShareLinks,
  type ShareLink,
  type ShareLinkCreated,
} from '../api/shares'
import { formatDate, formatDateTime } from '../format'

const EXPIRY_OPTIONS = [
  { value: 'none', label: 'Nessuna scadenza' },
  { value: '7', label: '7 giorni' },
  { value: '30', label: '30 giorni' },
  { value: '90', label: '90 giorni' },
]

const STATUS: Record<ShareLink['status'], { label: string; color: string }> = {
  active: { label: 'Attivo', color: 'green' },
  expired: { label: 'Scaduto', color: 'gray' },
  revoked: { label: 'Revocato', color: 'red' },
}

type Props = { projectId: number; iterationId: number; archived: boolean; onClose: () => void }

export function ShareModal({ projectId, iterationId, archived, onClose }: Props) {
  const links = useShareLinks(projectId, iterationId)
  const create = useCreateShareLink(projectId, iterationId)
  const [label, setLabel] = useState('')
  const [expiry, setExpiry] = useState('30')
  const [created, setCreated] = useState<ShareLinkCreated | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    create.mutate(
      {
        label,
        expires_in_days: expiry === 'none' ? null : (Number(expiry) as 7 | 30 | 90),
      },
      {
        onSuccess: (link) => {
          setCreated(link)
          setLabel('')
        },
      },
    )
  }

  return (
    <Modal opened onClose={onClose} title="Condividi in sola lettura" size="lg">
      <Stack>
        <Text size="sm">
          Chi riceve il link vede il report di questa iterazione, sempre aggiornato, e può
          scaricarne il PDF. Non serve un account e non si può modificare nulla.
        </Text>
        {archived && (
          <Alert color="yellow">
            Il progetto è archiviato: i link sono sospesi e tornano a funzionare quando lo
            ripristini.
          </Alert>
        )}

        {created ? (
          <Paper withBorder p="md" bg="var(--mantine-color-green-light)">
            <Stack gap="xs">
              <Text fw={600}>Link creato per «{created.label}»</Text>
              <Group gap="xs" wrap="nowrap">
                <TextInput
                  aria-label="Link di condivisione"
                  value={created.url}
                  readOnly
                  style={{ flex: 1 }}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <CopyButton value={created.url}>
                  {({ copied, copy }) => (
                    <Button onClick={copy} color={copied ? 'teal' : undefined}>
                      {copied ? 'Copiato' : 'Copia'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
              <Text size="sm">
                Copialo ora: per sicurezza non verrà più mostrato. Se lo perdi, creane un altro.
              </Text>
              <Group justify="flex-end">
                <Button variant="default" size="xs" onClick={() => setCreated(null)}>
                  Fatto
                </Button>
              </Group>
            </Stack>
          </Paper>
        ) : (
          <form onSubmit={submit}>
            <Group align="flex-end" wrap="wrap">
              <TextInput
                label="Destinatario"
                description="Un'etichetta per riconoscere il link, es. Mario Rossi · ACME"
                required
                maxLength={120}
                value={label}
                onChange={(event) => setLabel(event.currentTarget.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
              <Select
                label="Scadenza"
                data={EXPIRY_OPTIONS}
                value={expiry}
                onChange={(value) => setExpiry(value ?? 'none')}
                allowDeselect={false}
                w={170}
              />
              <Button type="submit" loading={create.isPending} disabled={!label.trim()}>
                Crea link
              </Button>
            </Group>
            {create.isError && (
              <Alert color="red" mt="sm">
                {create.error.message}
              </Alert>
            )}
          </form>
        )}

        <Divider label="Link creati" labelPosition="left" />
        {links.isPending && <Loader size="sm" />}
        {links.isError && <Alert color="red">{links.error.message}</Alert>}
        {links.data?.length === 0 && (
          <Text size="sm" c="dimmed">
            Nessun link per questa iterazione.
          </Text>
        )}
        {links.data?.map((link) => (
          <ShareLinkRow key={link.id} link={link} projectId={projectId} iterationId={iterationId} />
        ))}
      </Stack>
    </Modal>
  )
}

function ShareLinkRow({
  link,
  projectId,
  iterationId,
}: {
  link: ShareLink
  projectId: number
  iterationId: number
}) {
  const revoke = useRevokeShareLink(projectId, iterationId)
  const remove = useDeleteShareLink(projectId, iterationId)
  const [confirming, setConfirming] = useState(false)
  const status = STATUS[link.status]
  const error = revoke.error ?? remove.error

  return (
    <Paper withBorder p="sm" aria-label={`Link ${link.label}`}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={600}>{link.label}</Text>
            <Badge color={status.color} variant="light">
              {status.label}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Creato il {formatDate(link.created_at)}
            {link.expires_at &&
              !link.revoked_at &&
              ` · ${link.status === 'expired' ? 'scaduto' : 'scade'} il ${formatDate(link.expires_at)}`}
            {link.revoked_at && ` · revocato il ${formatDate(link.revoked_at)}`}
          </Text>
          <Text size="xs" c="dimmed">
            {link.last_accessed_at
              ? `Aperto ${link.access_count === 1 ? '1 volta' : `${link.access_count} volte`}, l'ultima il ${formatDateTime(link.last_accessed_at)}`
              : 'Non ancora aperto'}
          </Text>
        </Stack>
        {link.status === 'active' ? (
          confirming ? (
            <Group gap="xs" wrap="nowrap">
              <Button size="xs" variant="default" onClick={() => setConfirming(false)}>
                Annulla
              </Button>
              <Button
                size="xs"
                color="red"
                loading={revoke.isPending}
                onClick={() => revoke.mutate(link.id)}
              >
                Conferma revoca
              </Button>
            </Group>
          ) : (
            <Button size="xs" variant="light" color="red" onClick={() => setConfirming(true)}>
              Revoca
            </Button>
          )
        ) : (
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            loading={remove.isPending}
            onClick={() => remove.mutate(link.id)}
          >
            Elimina
          </Button>
        )}
      </Group>
      {error && (
        <Alert color="red" mt="xs">
          {error.message}
        </Alert>
      )}
    </Paper>
  )
}
