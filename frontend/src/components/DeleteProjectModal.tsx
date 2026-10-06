import { Alert, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'

type Props = {
  projectName: string
  pending: boolean
  error: Error | null
  onClose: () => void
  onConfirm: (confirmName: string) => void
}

export function DeleteProjectModal({ projectName, pending, error, onClose, onConfirm }: Props) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === projectName

  function submit(event: FormEvent) {
    event.preventDefault()
    if (matches) onConfirm(typed)
  }

  return (
    <Modal opened onClose={onClose} title="Elimina definitivamente">
      <form onSubmit={submit}>
        <Stack>
          <Text size="sm">
            Il progetto, tutte le sue iterazioni e tutte le risposte verranno eliminati.
            L'operazione non si può annullare.
          </Text>
          <TextInput
            label={`Per confermare, scrivi il nome del progetto: ${projectName}`}
            value={typed}
            onChange={(event) => setTyped(event.currentTarget.value)}
            data-autofocus
          />
          {error && <Alert color="red">{error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" color="red" loading={pending} disabled={!matches}>
              Elimina definitivamente
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
