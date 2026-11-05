import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconLogout, IconUserPlus, IconX } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { useMe } from '../api/auth'
import { useInviteMember, useMembers, useRemoveMember, type Member } from '../api/members'

function MemberRow({
  member,
  canRemove,
  onRemove,
}: {
  member: Member
  canRemove: boolean
  onRemove: () => void
}) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="xs">
      <div style={{ minWidth: 0 }}>
        <Text size="sm" truncate>
          {member.name ?? member.email}
        </Text>
        {member.name && member.name !== member.email && (
          <Text size="xs" c="dimmed" truncate>
            {member.email}
          </Text>
        )}
      </div>
      <Group gap={4} wrap="nowrap">
        {member.pending && (
          <Tooltip
            label="Vedrà il progetto appena si iscrive e conferma questa email"
            multiline
            w={220}
          >
            <Badge color="yellow" variant="light">
              Invitato
            </Badge>
          </Tooltip>
        )}
        {canRemove && (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`Rimuovi ${member.email}`}
            onClick={onRemove}
          >
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  )
}

/** Colleagues on the project: the owner invites and removes, collaborators can leave. */
export function CollaboratorsCard({ projectId }: { projectId: number }) {
  const me = useMe()
  const members = useMembers(projectId)
  const invite = useInviteMember(projectId)
  const remove = useRemoveMember(projectId)
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [leaving, setLeaving] = useState(false)

  if (members.isPending) return <Loader size="sm" />
  if (members.isError) return <Alert color="red">{members.error.message}</Alert>
  const { owner, can_manage: canManage, limit } = members.data
  const list = members.data.members
  const mine = list.find((member) => member.email === me.data?.email)
  const full = list.length >= limit

  function submit(event: FormEvent) {
    event.preventDefault()
    invite.mutate(address.trim(), { onSuccess: () => setAddress('') })
  }

  return (
    <Card>
      <Stack gap="sm">
        <div>
          <Title order={4}>Collaboratori</Title>
          <Text size="sm" c="dimmed">
            {canManage
              ? `Colleghi che lavorano con te su questo progetto, fino a ${limit}.`
              : 'Le persone che lavorano su questo progetto.'}
          </Text>
        </div>

        <Group justify="space-between" wrap="nowrap" gap="xs">
          <div style={{ minWidth: 0 }}>
            <Text size="sm" truncate>
              {owner.name}
            </Text>
            {owner.name !== owner.email && (
              <Text size="xs" c="dimmed" truncate>
                {owner.email}
              </Text>
            )}
          </div>
          <Badge variant="light">Proprietario</Badge>
        </Group>
        {list.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            canRemove={canManage}
            onRemove={() => remove.mutate(member.id)}
          />
        ))}
        {list.length === 0 && (
          <Text size="sm" c="dimmed">
            Nessun collaboratore.
          </Text>
        )}

        {canManage && (
          <form onSubmit={submit}>
            <Stack gap="xs">
              <TextInput
                type="email"
                label="Invita un collega"
                placeholder="email@esempio.it"
                value={address}
                onChange={(event) => setAddress(event.currentTarget.value)}
                disabled={full}
              />
              <Button
                type="submit"
                variant="light"
                leftSection={<IconUserPlus size={16} />}
                loading={invite.isPending}
                disabled={full || !address.trim()}
              >
                Invita
              </Button>
              {full && (
                <Text size="xs" c="dimmed">
                  Hai raggiunto il massimo di {limit} collaboratori.
                </Text>
              )}
            </Stack>
          </form>
        )}
        {invite.isSuccess && !invite.data.notified && (
          <Alert color="yellow">
            Invito salvato, ma l'email non è partita: avvisa tu il collega.
          </Alert>
        )}
        {invite.isSuccess && invite.data.notified && (
          <Alert color="green">
            {invite.data.member.pending
              ? 'Invito inviato: vedrà il progetto appena si iscrive con questa email.'
              : 'Collega aggiunto e avvisato via email.'}
          </Alert>
        )}
        {invite.isError && <Alert color="red">{invite.error.message}</Alert>}
        {remove.isError && <Alert color="red">{remove.error.message}</Alert>}

        {!canManage && mine && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={() => setLeaving(true)}
          >
            Lascia il progetto
          </Button>
        )}
      </Stack>

      <Modal opened={leaving} onClose={() => setLeaving(false)} title="Lasciare il progetto?">
        <Stack>
          <Text size="sm">
            Non vedrai più questo progetto. Le risposte che hai scritto restano al proprietario, che
            potrà invitarti di nuovo.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setLeaving(false)}>
              Annulla
            </Button>
            <Button
              color="red"
              loading={remove.isPending}
              onClick={() => mine && remove.mutate(mine.id, { onSuccess: () => navigate('/') })}
            >
              Lascia il progetto
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  )
}
