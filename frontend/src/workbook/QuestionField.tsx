import {
  Button,
  Checkbox,
  Group,
  List,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { useCallback, useState } from 'react'

import type { Answer, AnswerIn, Verdict } from '../api/answers'
import type { Question } from '../api/template'
import { ROMAN } from './structure'
import { useAutosave, type SaveStatus } from './useAutosave'

// `returnToPhase` is not edited yet (phase gates come in the next phase): it is carried over.
type Draft = {
  text: string
  verdict: Verdict | null
  choices: string[]
  returnToPhase: number | null
}

function draftFrom(answer: Answer | undefined): Draft {
  return {
    text: answer?.text ?? '',
    verdict: answer?.verdict ?? null,
    choices: answer?.choices ?? [],
    returnToPhase: answer?.return_to_phase ?? null,
  }
}

function toAnswerIn(draft: Draft): AnswerIn {
  return {
    text: draft.text.trim() ? draft.text : null,
    verdict: draft.verdict,
    choices: draft.choices.length ? draft.choices : null,
    return_to_phase: draft.returnToPhase,
  }
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: '',
  pending: 'Modifiche non salvate…',
  saving: 'Salvataggio…',
  saved: 'Salvato',
  error: 'Errore nel salvataggio',
}

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
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

const VERDICTS = [
  { value: 'go', label: 'GO' },
  { value: 'maybe', label: 'MAYBE' },
  { value: 'no_go', label: 'NO-GO' },
]
const VERDICT_COLOR: Record<Verdict, string> = { go: 'green', maybe: 'yellow', no_go: 'red' }

type Props = {
  question: Question
  answer: Answer | undefined
  save: (key: string, data: AnswerIn) => Promise<unknown>
}

/** One workbook question with its own draft, saved automatically. Remount to reset. */
export function QuestionField({ question, answer, save }: Props) {
  const [draft, setDraft] = useState(() => draftFrom(answer))
  const saveDraft = useCallback(
    (value: Draft) => save(question.key, toAnswerIn(value)),
    [question.key, save],
  )
  const { status, retry } = useAutosave(draft, saveDraft)
  const update = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }))
  const hasVerdict = question.type === 'go_no_go' || question.type === 'phase_gate'

  return (
    <Paper withBorder p="md" component="section" aria-labelledby={`q-${question.key}`}>
      <Stack gap="sm">
        <Text fw={600} id={`q-${question.key}`}>
          {question.prompt}
        </Text>
        <Text size="sm" c="dimmed">
          {question.help}
        </Text>

        {question.type === 'multi_choice' && (
          <Checkbox.Group
            value={draft.choices}
            onChange={(choices) => update({ choices })}
            aria-label={question.prompt}
          >
            <Stack gap="xs">
              {question.options.map((option) => (
                <Checkbox key={option.key} value={option.key} label={option.label} />
              ))}
            </Stack>
          </Checkbox.Group>
        )}

        {hasVerdict && (
          <SegmentedControl
            data={VERDICTS}
            value={draft.verdict ?? ''}
            onChange={(value) => update({ verdict: value as Verdict })}
            color={draft.verdict ? VERDICT_COLOR[draft.verdict] : undefined}
            aria-label={`Verdetto: ${question.prompt}`}
          />
        )}

        {question.type === 'phase_gate' && question.criteria.length > 0 && (
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Criteri di passaggio
            </Text>
            <List size="sm" spacing={4}>
              {question.criteria.map((criterion) => (
                <List.Item key={criterion.key}>
                  {criterion.label}
                  {criterion.return_to && (
                    <Text span size="xs" c="dimmed">
                      {' '}
                      — se manca, si torna alla Fase {ROMAN[criterion.return_to - 1]}
                    </Text>
                  )}
                </List.Item>
              ))}
            </List>
            <Text size="xs" c="dimmed">
              La checklist da spuntare e la fase di ritorno suggerita arrivano nella prossima fase
              di sviluppo.
            </Text>
          </Stack>
        )}

        <Textarea
          aria-label={
            question.type === 'text' ? question.prompt : `Note e motivazione: ${question.prompt}`
          }
          placeholder={
            question.type === 'text'
              ? 'Scrivi la risposta…'
              : question.type === 'multi_choice'
                ? 'Note (facoltative)…'
                : 'Motivazione…'
          }
          autosize
          minRows={question.type === 'text' ? 4 : 2}
          value={draft.text}
          onChange={(event) => update({ text: event.currentTarget.value })}
        />
        <SaveIndicator status={status} onRetry={retry} />
      </Stack>
    </Paper>
  )
}
