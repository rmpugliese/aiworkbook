import { describe, expect, it } from 'vitest'

import type { Answer } from '../api/answers'
import type { Template } from '../api/template'
import { TEMPLATE } from '../test/api'
import { flattenTasks, isAnswered, phaseLabel, phaseProgress } from './structure'

const template = TEMPLATE as Template

function answer(fields: Partial<Answer>): Answer {
  return {
    question_key: 'k',
    text: null,
    verdict: null,
    choices: null,
    return_to_phase: null,
    updated_at: null,
    ...fields,
  }
}

describe('workbook structure', () => {
  it('lists tasks in workbook order with their paths', () => {
    expect(flattenTasks(template).map((ref) => ref.path)).toEqual([
      '1.objectives.problem',
      '1.objectives.patterns',
      '1.gate.decision',
      '2.quality.verify',
      '2.gate.decision',
    ])
  })

  it('counts an answer with text, a verdict or a choice as answered', () => {
    expect(isAnswered(undefined)).toBe(false)
    expect(isAnswered(answer({ text: '   ' }))).toBe(false)
    expect(isAnswered(answer({ choices: [] }))).toBe(false)
    expect(isAnswered(answer({ text: 'Risposta' }))).toBe(true)
    expect(isAnswered(answer({ verdict: 'maybe' }))).toBe(true)
    expect(isAnswered(answer({ choices: ['predictive'] }))).toBe(true)
  })

  it('computes progress per phase', () => {
    const answers = new Map([
      ['p1.objectives.problem.what', answer({ text: 'Ridurre gli abbandoni' })],
      ['p1.gate.decision.outcome', answer({ verdict: 'go' })],
      ['p2.quality.verify.factor', answer({ text: ' ' })],
    ])

    expect(phaseProgress(template.phases[0], answers)).toEqual({ answered: 2, total: 3 })
    expect(phaseProgress(template.phases[1], answers)).toEqual({ answered: 0, total: 2 })
  })

  it('labels phases with roman numerals', () => {
    expect(phaseLabel(template.phases[1])).toBe('Fase II · Comprensione dei dati')
  })
})
