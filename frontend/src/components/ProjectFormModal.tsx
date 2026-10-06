import { Alert, Button, Group, Modal, Stack, TextInput, Textarea } from '@mantine/core'
import { useState, type FormEvent } from 'react'

export type ProjectFormValues = { name: string; client_name: string; description: string }

type Props = {
  opened: boolean
  title: string
  submitLabel: string
  initial?: Partial<ProjectFormValues>
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (values: ProjectFormValues) => void
}

/** Create or edit a project. Remount it (via `key`) to reset the fields. */
export function ProjectFormModal(props: Props) {
  const [values, setValues] = useState<ProjectFormValues>({
    name: props.initial?.name ?? '',
    client_name: props.initial?.client_name ?? '',
    description: props.initial?.description ?? '',
  })
  const set = (field: keyof ProjectFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }))

  function submit(event: FormEvent) {
    event.preventDefault()
    props.onSubmit(values)
  }

  return (
    <Modal opened={props.opened} onClose={props.onClose} title={props.title}>
      <form onSubmit={submit}>
        <Stack>
          <TextInput
            label="Nome del progetto"
            required
            maxLength={200}
            value={values.name}
            onChange={(event) => set('name')(event.currentTarget.value)}
            data-autofocus
          />
          <TextInput
            label="Azienda cliente"
            maxLength={200}
            value={values.client_name}
            onChange={(event) => set('client_name')(event.currentTarget.value)}
          />
          <Textarea
            label="Descrizione"
            autosize
            minRows={3}
            value={values.description}
            onChange={(event) => set('description')(event.currentTarget.value)}
          />
          {props.error && <Alert color="red">{props.error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={props.onClose}>
              Annulla
            </Button>
            <Button type="submit" loading={props.pending} disabled={!values.name.trim()}>
              {props.submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
