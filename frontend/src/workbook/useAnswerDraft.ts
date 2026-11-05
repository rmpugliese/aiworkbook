import { useCallback, useRef, useState } from 'react'

import { AnswerConflictError, type Answer, type AnswerIn, type Verdict } from '../api/answers'
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

export type SaveAnswer = (key: string, data: AnswerIn) => Promise<Answer>

/**
 * The editable draft of one answer, saved automatically. Remount the caller to reset it.
 *
 * Each save says which stored version the edit starts from; if a colleague saved a newer one
 * meanwhile, `conflict` holds it until the user keeps their own text or takes the colleague's.
 */
export function useAnswerDraft(question: Question, answer: Answer | undefined, save: SaveAnswer) {
  const [draft, setDraft] = useState(() => draftFrom(answer))
  const [conflict, setConflict] = useState<Answer | null>(null)
  const base = useRef(answer?.updated_at ?? null)
  const saveDraft = useCallback(
    async (value: Draft) => {
      try {
        const saved = await save(question.key, {
          ...toAnswerIn(value),
          base_updated_at: base.current,
        })
        base.current = saved.updated_at
      } catch (error) {
        if (error instanceof AnswerConflictError) setConflict(error.current)
        throw error
      }
    },
    [question.key, save],
  )
  const { status, retry, markSaved } = useAutosave(draft, saveDraft)
  const update = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }))

  /** Saves the user's text over the colleague's version. */
  const keepMine = () => {
    if (!conflict) return
    base.current = conflict.updated_at
    setConflict(null)
    retry()
  }
  /** Drops the user's edit and shows the colleague's version. */
  const takeTheirs = () => {
    if (!conflict) return
    const theirs = draftFrom(conflict)
    base.current = conflict.updated_at
    setConflict(null)
    markSaved(theirs)
    setDraft(theirs)
  }

  return { draft, update, status, retry, conflict, keepMine, takeTheirs }
}
