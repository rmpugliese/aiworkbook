import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Popover,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { useState } from 'react'

import { useAssist, type AssistAction } from '../api/ai'
import { Markdown } from './Markdown'

export type AssistantContext = { projectId: number; iterationId: number }

const LABEL: Record<AssistAction, string> = {
  suggest: 'Suggerisci una bozza',
  improve: 'Migliora il testo',
  review: 'Critica e domande',
}

const INSTRUCTIONS_LIMIT = 1000

type Props = {
  assistant: AssistantContext
  questionKey: string
  text: string
  verdict: 'go' | 'maybe' | 'no_go' | null
  onApply: (text: string) => void
}

/** The "Assistente" popover of a field (optional guidance, then the action) and the proposal it streams back. Nothing is applied
 * without the user's choice. */
export function AssistantPanel({ assistant, questionKey, text, verdict, onApply }: Props) {
  const { state, run, stop, reset } = useAssist(assistant.projectId, assistant.iterationId)
  // Guidance for the requests on this field: kept while the page is open, never saved.
  const [instructions, setInstructions] = useState('')
  const [opened, setOpened] = useState(false)
  const ask = (action: AssistAction) => {
    setOpened(false)
    run({ questionKey, action, text, verdict, instructions: instructions.trim() })
  }
  const proposal = state.status === 'idle' ? '' : state.text.trim()
  const appliable = state.status === 'done' && state.action !== 'review' && proposal

  return (
    <Stack gap="xs">
      <Group justify="flex-end">
        <Popover
          opened={opened}
          onChange={setOpened}
          position="bottom-end"
          width={340}
          shadow="md"
          withinPortal
          // Stays put while typing: without layout (tests) the target would count as detached.
          hideDetached={false}
        >
          <Popover.Target>
            <Button
              size="compact-xs"
              variant="light"
              disabled={state.status === 'streaming'}
              onClick={() => setOpened((open) => !open)}
            >
              Assistente
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <Textarea
                size="xs"
                label="Indicazioni per l'assistente (facoltative)"
                description={`Non vengono salvate. ${instructions.length}/${INSTRUCTIONS_LIMIT}`}
                placeholder="Es. tono formale, al massimo 5 punti, concentrati sui rischi GDPR"
                autosize
                minRows={2}
                maxRows={8}
                maxLength={INSTRUCTIONS_LIMIT}
                value={instructions}
                onChange={(event) => setInstructions(event.currentTarget.value)}
              />
              <Stack gap={4}>
                <Button
                  size="xs"
                  variant="light"
                  justify="flex-start"
                  onClick={() => ask('suggest')}
                >
                  {LABEL.suggest}
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  justify="flex-start"
                  onClick={() => ask('improve')}
                  disabled={!text.trim()}
                >
                  {LABEL.improve}
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  justify="flex-start"
                  onClick={() => ask('review')}
                >
                  {LABEL.review}
                </Button>
              </Stack>
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </Group>

      {state.status !== 'idle' && (
        <Paper
          withBorder
          p="sm"
          bg="var(--mantine-color-blue-light)"
          aria-label="Proposta dell'assistente"
        >
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap={6}>
                <Text size="xs" fw={600} c="blue">
                  {LABEL[state.action]}
                </Text>
                {/* Generated content is labelled as such (AI Act, art. 50). */}
                <Badge size="xs" variant="light" color="violet">
                  Generato dall'AI · da verificare
                </Badge>
              </Group>
              {state.status === 'streaming' && <Loader size="xs" />}
            </Group>
            {proposal && <Markdown text={proposal} />}
            {state.status === 'error' && <Alert color="red">{state.message}</Alert>}
            <Group gap="xs" justify="flex-end">
              {state.status === 'streaming' && (
                <Button size="compact-xs" variant="default" onClick={stop}>
                  Interrompi
                </Button>
              )}
              {appliable && (
                <>
                  <Button
                    size="compact-xs"
                    onClick={() => {
                      onApply(proposal)
                      reset()
                    }}
                  >
                    Sostituisci
                  </Button>
                  <Button
                    size="compact-xs"
                    variant="light"
                    onClick={() => {
                      onApply(text.trim() ? `${text.trimEnd()}\n\n${proposal}` : proposal)
                      reset()
                    }}
                  >
                    Aggiungi in fondo
                  </Button>
                </>
              )}
              {state.status === 'done' && state.action === 'review' && proposal && (
                <Button
                  size="compact-xs"
                  variant="light"
                  onClick={() => void navigator.clipboard?.writeText(proposal)}
                >
                  Copia
                </Button>
              )}
              {state.status !== 'streaming' && (
                <Button size="compact-xs" variant="subtle" color="gray" onClick={reset}>
                  {appliable ? 'Scarta' : 'Chiudi'}
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
