import type { Answer, Verdict } from '../api/answers'
import type { Phase, QuestionOfType, Template } from '../api/template'

export type GateQuestion = QuestionOfType<'phase_gate'>
export type FactorQuestion = QuestionOfType<'go_no_go'>
export type FactorGroup = FactorQuestion['factor_group']

export const VERDICT_LABEL: Record<Verdict, string> = { go: 'GO', maybe: 'MAYBE', no_go: 'NO-GO' }
export const VERDICT_COLOR: Record<Verdict, string> = { go: 'green', maybe: 'yellow', no_go: 'red' }
export const FACTOR_GROUP_LABEL: Record<FactorGroup, string> = {
  business: 'Business',
  data: 'Dati',
  execution: 'Esecuzione',
}

const questionsOf = (phase: Phase) =>
  phase.task_groups.flatMap((group) => group.tasks.flatMap((task) => task.questions))

export function gateOf(phase: Phase): GateQuestion | undefined {
  return questionsOf(phase).find((q): q is GateQuestion => q.type === 'phase_gate')
}

export type Factor = { question: FactorQuestion; taskPath: string; verdict: Verdict | null }

/** The nine AI Go/No-Go factors, grouped by business / data / execution, in workbook order. */
export function factorMatrix(
  template: Template,
  answers: Map<string, Answer>,
): Record<FactorGroup, Factor[]> {
  const matrix: Record<FactorGroup, Factor[]> = { business: [], data: [], execution: [] }
  for (const phase of template.phases) {
    for (const group of phase.task_groups) {
      for (const task of group.tasks) {
        for (const question of task.questions) {
          if (question.type !== 'go_no_go') continue
          matrix[question.factor_group].push({
            question,
            taskPath: `${phase.number}.${group.key}.${task.key}`,
            verdict: answers.get(question.key)?.verdict ?? null,
          })
        }
      }
    }
  }
  return matrix
}

export type PhaseOneSuggestion =
  { complete: true; verdict: Verdict } | { complete: false; answered: number; total: number }

/** Any NO-GO wins, then any MAYBE; GO only when every factor is GO. */
export function phaseOneSuggestion(factors: Factor[]): PhaseOneSuggestion {
  const verdicts = factors.map((factor) => factor.verdict)
  const answered = verdicts.filter((verdict) => verdict !== null).length
  if (answered < verdicts.length) return { complete: false, answered, total: verdicts.length }
  if (verdicts.includes('no_go')) return { complete: true, verdict: 'no_go' }
  if (verdicts.includes('maybe')) return { complete: true, verdict: 'maybe' }
  return { complete: true, verdict: 'go' }
}

export type GateSuggestion = {
  verdict: Verdict
  returnTo: number | null
  /** Unmet criteria that point back to `returnTo`. */
  reasons: GateQuestion['criteria']
}

/**
 * All criteria met → GO. Only criteria fixable within the phase unmet → MAYBE. Any unmet
 * criterion that points to an earlier phase → NO-GO, returning to the furthest-upstream phase.
 */
export function gateSuggestion(gate: GateQuestion, satisfied: string[]): GateSuggestion {
  const unmet = gate.criteria.filter((criterion) => !satisfied.includes(criterion.key))
  const pointing = unmet.filter((criterion) => criterion.return_to != null)
  if (pointing.length === 0) {
    return { verdict: unmet.length ? 'maybe' : 'go', returnTo: null, reasons: [] }
  }
  const returnTo = Math.min(...pointing.map((criterion) => criterion.return_to!))
  return {
    verdict: 'no_go',
    returnTo,
    reasons: pointing.filter((criterion) => criterion.return_to === returnTo),
  }
}

/** The verdict stored in the phase's gate, or null while not yet assessed. */
export function phaseStatus(phase: Phase, answers: Map<string, Answer>): Verdict | null {
  const gate = gateOf(phase)
  return gate ? (answers.get(gate.key)?.verdict ?? null) : null
}
