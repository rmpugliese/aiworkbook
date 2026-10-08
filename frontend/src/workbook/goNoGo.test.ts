import { describe, expect, it } from 'vitest'

import type { Answer, Verdict } from '../api/answers'
import type { Template } from '../api/template'
import { TEMPLATE } from '../test/api'
import {
  factorMatrix,
  gateSuggestion,
  phaseOneSuggestion,
  phaseStatus,
  type Factor,
  type GateQuestion,
} from './goNoGo'

function factors(...verdicts: (Verdict | null)[]): Factor[] {
  return verdicts.map((verdict, index) => ({
    question: {
      key: `p1.go_no_go.f.q${index}`,
      type: 'go_no_go',
      factor_group: 'business',
      prompt: 'Fattore',
      help: 'Aiuto',
    },
    taskPath: '1.go_no_go.f',
    verdict,
  }))
}

const GATE: GateQuestion = {
  key: 'p5.gate.decision.outcome',
  type: 'phase_gate',
  prompt: 'Si passa alla Fase VI?',
  help: 'Aiuto',
  criteria: [
    { key: 'metrics', label: 'Metriche raggiunte', return_to: 4 },
    { key: 'data', label: 'Dati rappresentativi', return_to: 2 },
    { key: 'kpis', label: 'KPI raggiunti', return_to: 1 },
    { key: 'plan', label: 'Piano di iterazione', return_to: null },
  ],
}

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

describe('phaseOneSuggestion', () => {
  it('waits until every factor has a verdict', () => {
    expect(phaseOneSuggestion(factors('go', null, 'go'))).toEqual({
      complete: false,
      answered: 2,
      total: 3,
    })
  })

  it('is NO-GO if any factor is NO-GO, then MAYBE if any is MAYBE, else GO', () => {
    expect(phaseOneSuggestion(factors('go', 'maybe', 'no_go'))).toEqual({
      complete: true,
      verdict: 'no_go',
    })
    expect(phaseOneSuggestion(factors('go', 'maybe', 'go'))).toEqual({
      complete: true,
      verdict: 'maybe',
    })
    expect(phaseOneSuggestion(factors('go', 'go', 'go'))).toEqual({ complete: true, verdict: 'go' })
  })
})

describe('gateSuggestion', () => {
  it('is GO when every criterion is met', () => {
    expect(gateSuggestion(GATE, ['metrics', 'data', 'kpis', 'plan'])).toEqual({
      verdict: 'go',
      returnTo: null,
      reasons: [],
    })
  })

  it('is MAYBE when only criteria fixable within the phase are unmet', () => {
    expect(gateSuggestion(GATE, ['metrics', 'data', 'kpis']).verdict).toBe('maybe')
    expect(gateSuggestion(GATE, ['metrics', 'data', 'kpis']).returnTo).toBeNull()
  })

  it('returns to the furthest-upstream phase among unmet criteria', () => {
    const suggestion = gateSuggestion(GATE, ['kpis', 'plan'])

    expect(suggestion.verdict).toBe('no_go')
    expect(suggestion.returnTo).toBe(2)
    expect(suggestion.reasons.map((criterion) => criterion.key)).toEqual(['data'])
  })

  it('treats a gate without criteria as nothing to check', () => {
    expect(gateSuggestion({ ...GATE, criteria: [] }, []).verdict).toBe('go')
  })
})

describe('factorMatrix and phaseStatus', () => {
  const template = TEMPLATE as Template

  it('groups the factors with their stored verdict', () => {
    const matrix = factorMatrix(
      template,
      new Map([['p2.quality.verify.factor', answer({ verdict: 'maybe' })]]),
    )

    expect(matrix.business).toEqual([])
    expect(matrix.data.map((factor) => [factor.taskPath, factor.verdict])).toEqual([
      ['2.quality.verify', 'maybe'],
    ])
  })

  it('reads the phase status from its gate', () => {
    const answers = new Map([['p1.gate.decision.outcome', answer({ verdict: 'no_go' })]])

    expect(phaseStatus(template.phases[0], answers)).toBe('no_go')
    expect(phaseStatus(template.phases[1], answers)).toBeNull()
  })
})
