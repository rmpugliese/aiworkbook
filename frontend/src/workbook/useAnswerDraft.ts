import { useCallback, useState } from 'react'

import type { Answer, AnswerIn, Verdict } from '../api/answers'
import type { Question } from '../api/template'
import { useAutosave } from './useAutosave'

export type Draft = {
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

export type SaveAnswer = (key: string, data: AnswerIn) => Promise<unknown>

/** The editable draft of one answer, saved automatically. Remount the caller to reset it. */
export function useAnswerDraft(question: Question, answer: Answer | undefined, save: SaveAnswer) {
  const [draft, setDraft] = useState(() => draftFrom(answer))
  const saveDraft = useCallback(
    (value: Draft) => save(question.key, toAnswerIn(value)),
    [question.key, save],
  )
  const { status, retry } = useAutosave(draft, saveDraft)
  const update = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }))
  return { draft, update, status, retry }
}
