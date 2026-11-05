import { Alert, Button, Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import type { Answer, Verdict } from '../api/answers'
import { useMe } from '../api/auth'
import { formatDateTime } from '../format'
import type { Question } from '../api/template'
import { VERDICT_COLOR, VERDICT_LABEL } from './goNoGo'
import type { SaveStatus } from './useAutosave'

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: '',
  pending: 'Modifiche non salvate…',
  saving: 'Salvataggio…',
  saved: 'Salvato',
  error: 'Errore nel salvataggio',
}

export function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'idle') return null
  return (
    <Group gap="xs" justify="flex-end" mih={28}>
      <Text size="xs" c={status === 'error' ? 'red' : 'dimmed'} role="status">
        {STATUS_TEXT[status]}
      </Text>
      {status === 'error' && (
        <Button size="compact-xs" variant="light" color="red" onClick={onRetry}>
          Riprova
        </Button>
      )}
    </Group>
  )
}

/** The bordered frame of a question: prompt, help, then the question's own controls. */
export function QuestionCard({ question, children }: { question: Question; children: ReactNode }) {
  return (
    <Paper withBorder p="lg" component="section" aria-labelledby={`q-${question.key}`}>
      <Stack gap="sm">
        <Text fw={600} size="md" id={`q-${question.key}`}>
          {question.prompt}
        </Text>
        <Text size="sm" c="dimmed">
          {question.help}
        </Text>
        {children}
      </Stack>
    </Paper>
  )
}

const VERDICT_OPTIONS = (['go', 'maybe', 'no_go'] as const).map((value) => ({
  value,
  label: VERDICT_LABEL[value],
}))

export function VerdictControl({
  value,
  onChange,
  label,
}: {
  value: Verdict | null
  onChange: (verdict: Verdict) => void
  label: string
}) {
  return (
    <SegmentedControl
      data={VERDICT_OPTIONS}
      value={value ?? ''}
      onChange={(next) => onChange(next as Verdict)}
      color={value ? VERDICT_COLOR[value] : undefined}
      aria-label={label}
    />
  )
}

function answerSummary(answer: Answer): string {
  const parts = [
    answer.verdict ? VERDICT_LABEL[answer.verdict] : null,
    answer.choices?.length ? `${answer.choices.length} opzioni scelte` : null,
    answer.text,
  ].filter(Boolean)
  return parts.join(' · ') || '(risposta vuota)'
}

/** A colleague saved this answer while the user was editing it: keep one of the two. */
export function ConflictNotice({
  current,
  onKeepMine,
  onTakeTheirs,
}: {
  current: Answer
  onKeepMine: () => void
  onTakeTheirs: () => void
}) {
  const who = current.updated_by_name ?? 'Un collega'
  return (
    <Alert color="orange" title={`${who} ha modificato questa risposta mentre la scrivevi`}>
      <Stack gap="xs">
        <Text size="sm">La sua versione:</Text>
        <Paper withBorder p="xs" bg="var(--mantine-color-body)">
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} lineClamp={8}>
            {answerSummary(current)}
          </Text>
        </Paper>
        <Text size="sm">La tua è ancora nel campo qui sopra, non salvata.</Text>
        <Group gap="xs">
          <Button size="xs" onClick={onKeepMine}>
            Tieni la mia
          </Button>
          <Button size="xs" variant="default" onClick={onTakeTheirs}>
            Usa la sua
          </Button>
        </Group>
      </Stack>
    </Alert>
  )
}

/** "Modificata da Mario": only when the last save was someone else's. */
export function LastEditedBy({ answer }: { answer: Answer | undefined }) {
  const me = useMe()
  if (!answer?.updated_by_name || !answer.updated_at || answer.updated_by_id === me.data?.id) {
    return null
  }
  return (
    <Group gap={4} c="dimmed" wrap="nowrap">
      <IconUsers size={14} stroke={1.7} />
      <Text size="xs">
        Modificata da {answer.updated_by_name}, {formatDateTime(answer.updated_at)}
      </Text>
    </Group>
  )
}

type DraftHandle = {
  status: SaveStatus
  retry: () => void
  conflict: Answer | null
  keepMine: () => void
  takeTheirs: () => void
}

/** Below a question: who changed it last, the save status, or the conflict to resolve. */
export function AnswerFooter({
  answer,
  handle,
}: {
  answer: Answer | undefined
  handle: DraftHandle
}) {
  if (handle.conflict) {
    return (
      <ConflictNotice
        current={handle.conflict}
        onKeepMine={handle.keepMine}
        onTakeTheirs={handle.takeTheirs}
      />
    )
  }
  return (
    <Group justify="space-between" gap="xs" mih={28}>
      <LastEditedBy answer={answer} />
      <SaveIndicator status={handle.status} onRetry={handle.retry} />
    </Group>
  )
}
