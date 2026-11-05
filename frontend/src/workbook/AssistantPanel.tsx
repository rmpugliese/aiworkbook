import { Alert, Badge, Button, Group, Loader, Menu, Paper, Stack, Text } from '@mantine/core'

import { useAssist, type AssistAction } from '../api/ai'
import { Markdown } from './Markdown'

export type AssistantContext = { projectId: number; iterationId: number }

const LABEL: Record<AssistAction, string> = {
  suggest: 'Suggerisci una bozza',
  improve: 'Migliora il testo',
  review: 'Critica e domande',
}

type Props = {
  assistant: AssistantContext
  questionKey: string
  text: string
  verdict: 'go' | 'maybe' | 'no_go' | null
  onApply: (text: string) => void
}

/** The "Assistente" menu of a field and the proposal it streams back. Nothing is applied
 * without the user's choice. */
export function AssistantPanel({ assistant, questionKey, text, verdict, onApply }: Props) {
  const { state, run, stop, reset } = useAssist(assistant.projectId, assistant.iterationId)
  const ask = (action: AssistAction) => run({ questionKey, action, text, verdict })
  const proposal = state.status === 'idle' ? '' : state.text.trim()
  const appliable = state.status === 'done' && state.action !== 'review' && proposal

  return (
    <Stack gap="xs">
      <Group justify="flex-end">
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <Button size="compact-xs" variant="light" disabled={state.status === 'streaming'}>
              Assistente
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => ask('suggest')}>{LABEL.suggest}</Menu.Item>
            <Menu.Item onClick={() => ask('improve')} disabled={!text.trim()}>
              {LABEL.improve}
            </Menu.Item>
            <Menu.Item onClick={() => ask('review')}>{LABEL.review}</Menu.Item>
          </Menu.Dropdown>
        </Menu>
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
