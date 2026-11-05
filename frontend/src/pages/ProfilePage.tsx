import { Alert, Button, Card, Group, Modal, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconCheck, IconDownload, IconTrash } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { EXPORT_DATA_URL, useDeleteAccount, useMe, useUpdateProfile, type User } from '../api/auth'

function DisplayNameCard({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [name, setName] = useState(user.display_name ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    update.mutate({ display_name: name.trim() })
  }

  return (
    <Card>
      <form onSubmit={submit}>
        <Stack>
          <Title order={3}>Dati personali</Title>
          <TextInput label="Email" value={user.email} readOnly variant="filled" />
          <TextInput
            label="Nome visualizzato"
            description="Il tuo nome o quello dello studio, es. Studio Rossi Consulenza"
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          {update.isError && <Alert color="red">{update.error.message}</Alert>}
          {update.isSuccess && (
            <Alert color="green" icon={<IconCheck size={16} />}>
              Nome salvato.
            </Alert>
          )}
          <Group>
            <Button type="submit" loading={update.isPending}>
              Salva
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  )
}

function DataCard({ user }: { user: User }) {
  const remove = useDeleteAccount()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const matches = typed.trim().toLowerCase() === user.email

  function submit(event: FormEvent) {
    event.preventDefault()
    if (matches) remove.mutate(typed, { onSuccess: () => navigate('/login') })
  }

  return (
    <Card>
      <Stack>
        <div>
          <Title order={3}>I tuoi dati</Title>
          <Text size="sm" c="dimmed">
            Scarica in un file JSON tutto ciò che l'app conserva su di te: account, marchio,
            progetti, risposte, link condivisi e registro dell'assistente.
          </Text>
        </div>
        <Group>
          <Button
            component="a"
            href={EXPORT_DATA_URL}
            download
            variant="default"
            leftSection={<IconDownload size={16} />}
          >
            Scarica i miei dati
          </Button>
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => {
              remove.reset()
              setTyped('')
              setConfirming(true)
            }}
          >
            Elimina l'account
          </Button>
        </Group>
      </Stack>
      <Modal opened={confirming} onClose={() => setConfirming(false)} title="Eliminare l'account?">
        <form onSubmit={submit}>
          <Stack>
            <Text size="sm">
              Verranno eliminati definitivamente l'account, tutti i progetti con iterazioni e
              risposte, i link condivisi e il logo. L'operazione non si può annullare: se ti serve,
              scarica prima i tuoi dati.
            </Text>
            <TextInput
              label={`Per confermare, scrivi la tua email: ${user.email}`}
              value={typed}
              onChange={(event) => setTyped(event.currentTarget.value)}
              data-autofocus
            />
            {remove.isError && <Alert color="red">{remove.error.message}</Alert>}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setConfirming(false)}>
                Annulla
              </Button>
              <Button type="submit" color="red" disabled={!matches} loading={remove.isPending}>
                Elimina definitivamente
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Card>
  )
}

export function ProfilePage() {
  const me = useMe()
  if (!me.data) return null
  return (
    <Stack gap="lg" py="xl" maw={880}>
      <div>
        <Title order={1}>Profilo</Title>
        <Text c="dimmed">I tuoi dati personali e i diritti sui tuoi dati.</Text>
      </div>
      <DisplayNameCard user={me.data} />
      <DataCard user={me.data} />
    </Stack>
  )
}
