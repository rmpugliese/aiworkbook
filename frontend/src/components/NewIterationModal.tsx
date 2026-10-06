import {
  Alert,
  Button,
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  TextInput,
  Textarea,
} from '@mantine/core'
import { useState, type FormEvent } from 'react'

import type { Iteration, IterationCreate } from '../api/projects'

type Props = {
  iterations: Iteration[]
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (data: IterationCreate) => void
}

export function NewIterationModal({ iterations, pending, error, onClose, onSubmit }: Props) {
  const latest = iterations.at(-1)
  const [title, setTitle] = useState(`Iterazione ${(latest?.number ?? 0) + 1}`)
  const [userStory, setUserStory] = useState('')
  const [mode, setMode] = useState<'empty' | 'copy'>('empty')
  const [sourceId, setSourceId] = useState<string | null>(latest ? String(latest.id) : null)

  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      title,
      user_story: userStory.trim() || null,
      copy_from_iteration_id: mode === 'copy' && sourceId ? Number(sourceId) : null,
    })
  }

  return (
    <Modal opened onClose={onClose} title="Nuova iterazione">
      <form onSubmit={submit}>
        <Stack>
          <TextInput
            label="Titolo"
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            data-autofocus
          />
          <Radio.Group
            label="Contenuto iniziale"
            value={mode}
            onChange={(value) => setMode(value as 'empty' | 'copy')}
          >
            <Stack gap="xs" mt="xs">
              <Radio value="empty" label="Iterazione vuota" />
              <Radio
                value="copy"
                label="Copia le risposte di un'iterazione precedente"
                disabled={iterations.length === 0}
              />
            </Stack>
          </Radio.Group>
          {mode === 'copy' && (
            <Select
              label="Iterazione da copiare"
              data={iterations.map((iteration) => ({
                value: String(iteration.id),
                label: `${iteration.number}. ${iteration.title}`,
              }))}
              value={sourceId}
              onChange={setSourceId}
              allowDeselect={false}
            />
          )}
          <Textarea
            label="User story"
            description={
              mode === 'copy'
                ? "Se la lasci vuota, viene copiata quella dell'iterazione scelta."
                : "La user story a cui si riferisce l'iterazione."
            }
            autosize
            minRows={2}
            value={userStory}
            onChange={(event) => setUserStory(event.currentTarget.value)}
          />
          {error && <Alert color="red">{error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Annulla
            </Button>
            <Button
              type="submit"
              loading={pending}
              disabled={!title.trim() || (mode === 'copy' && !sourceId)}
            >
              Crea iterazione
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
