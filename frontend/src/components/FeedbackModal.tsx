import { Alert, Button, Group, Modal, SegmentedControl, Stack, Text, Textarea } from '@mantine/core'
import { IconCircleCheck } from '@tabler/icons-react'
import { useState, type FormEvent } from 'react'

import { useSendFeedback, type FeedbackIn } from '../api/feedback'

const MIN = 10
const MAX = 4000

const KINDS: { value: FeedbackIn['kind']; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'problem', label: 'Problema' },
  { value: 'other', label: 'Altro' },
]

/** Write a suggestion and send it by email to whoever runs the installation. */
export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const send = useSendFeedback()
  const [kind, setKind] = useState<FeedbackIn['kind']>('idea')
  const [message, setMessage] = useState('')
  const length = message.trim().length

  function submit(event: FormEvent) {
    event.preventDefault()
    if (length >= MIN) send.mutate({ kind, message })
  }

  return (
    <Modal opened onClose={onClose} title="Suggerisci un'idea">
      {send.isSuccess ? (
        <Stack align="flex-start">
          <Alert color="green" icon={<IconCircleCheck />} title="Grazie!" w="100%">
            Il tuo messaggio è arrivato. Se serve, ti rispondiamo alla tua email.
          </Alert>
          <Button onClick={onClose}>Chiudi</Button>
        </Stack>
      ) : (
        <form onSubmit={submit}>
          <Stack>
            <Text size="sm" c="dimmed">
              Una funzione che ti manca, qualcosa che non va o un'idea per migliorare l'app: lo
              leggiamo davvero. Ti rispondiamo alla tua email.
            </Text>
            <SegmentedControl
              aria-label="Tipo di messaggio"
              data={KINDS}
              value={kind}
              onChange={(value) => setKind(value as FeedbackIn['kind'])}
            />
            <Textarea
              label="Il tuo messaggio"
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
              autosize
              minRows={5}
              maxRows={12}
              maxLength={MAX}
              description={`${length} / ${MAX} caratteri${length < MIN ? ` (almeno ${MIN})` : ''}`}
              data-autofocus
            />
            {send.error && <Alert color="red">{send.error.message}</Alert>}
            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" loading={send.isPending} disabled={length < MIN}>
                Invia
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
