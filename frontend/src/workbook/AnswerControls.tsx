import { Button, Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'

import type { Verdict } from '../api/answers'
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
    <Paper withBorder p="md" component="section" aria-labelledby={`q-${question.key}`}>
      <Stack gap="sm">
        <Text fw={600} id={`q-${question.key}`}>
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
