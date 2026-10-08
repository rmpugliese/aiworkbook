import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, iteration, mockApi, project, TEMPLATE } from '../test/api'
import { renderRoutes } from '../test/render'

const BASE = '/api/projects/1/iterations/10'
const GATE_2 = 'p2.gate.decision.outcome'

function stored(key: string, fields: Record<string, unknown>) {
  return {
    question_key: key,
    text: null,
    verdict: null,
    choices: null,
    return_to_phase: null,
    updated_at: '2026-10-08T09:00:00Z',
    ...fields,
  }
}

function apiWith(
  answers: unknown[] = [],
  extra: Record<string, Response | ((b: unknown) => Response)> = {},
) {
  return mockApi({
    'GET /api/health': HEALTH_OK,
    'GET /api/projects/1': Response.json(project()),
    [`GET ${BASE}`]: Response.json(iteration()),
    'GET /api/template/1': Response.json(TEMPLATE),
    [`GET ${BASE}/answers`]: Response.json(answers),
    [`PUT ${BASE}/answers/${GATE_2}`]: (body) =>
      Response.json(stored(GATE_2, body as Record<string, unknown>)),
    ...extra,
  })
}

describe('Go/No-Go', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())
  const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const suggestion = () => screen.getByRole('alert', { name: /Suggerimento/ }).textContent

  it('suggests the verdict and return phase from the criteria checklist', async () => {
    apiWith()
    renderRoutes(routes, `/projects/1/iterations/10?task=2.gate.decision`)

    await screen.findByText('Criteri di passaggio')
    expect(suggestion()).toContain('NO-GO')
    expect(suggestion()).toContain('Tornare alla Fase I: fonti individuate')

    await user().click(screen.getByLabelText('Fonti individuate'))
    expect(suggestion()).toContain('MAYBE')
    await user().click(screen.getByLabelText('Qualità nota'))
    expect(suggestion()).toContain('Suggerimento: GO.')
  })

  it('presets the suggested return phase, clears it on GO and saves the decision', async () => {
    const calls = apiWith()
    renderRoutes(routes, `/projects/1/iterations/10?task=2.gate.decision`)

    await user().click(await screen.findByText('NO-GO'))
    expect(screen.getByRole('combobox', { name: 'Fase a cui tornare' })).toHaveValue(
      'Fase I · Comprensione del business',
    )
    await act(() => vi.advanceTimersByTimeAsync(1100))
    expect(calls.filter((c) => c.method === 'PUT').at(-1)?.body).toEqual({
      text: null,
      verdict: 'no_go',
      choices: null,
      return_to_phase: 1,
    })

    await user().click(screen.getByText('GO', { exact: true }))
    expect(screen.queryByRole('combobox', { name: 'Fase a cui tornare' })).toBeNull()
    await act(() => vi.advanceTimersByTimeAsync(1100))
    expect(calls.filter((c) => c.method === 'PUT').at(-1)?.body).toMatchObject({
      verdict: 'go',
      return_to_phase: null,
    })
  })

  it('asks for a reason when the decision differs from the suggestion', async () => {
    apiWith()
    renderRoutes(routes, `/projects/1/iterations/10?task=2.gate.decision`)

    await user().click(await screen.findByText('GO', { exact: true }))
    expect(screen.getByText(/spiega nella motivazione/)).toBeInTheDocument()

    await user().type(
      screen.getByRole('textbox', { name: /Note e motivazione/ }),
      'Fonti in arrivo',
    )
    expect(screen.getByText('Scostamento motivato.')).toBeInTheDocument()
  })

  it('computes the phase I outcome from the nine factors', async () => {
    apiWith([stored('p2.quality.verify.factor', { verdict: 'maybe' })])
    renderRoutes(routes, `/projects/1/iterations/10?task=1.gate.decision`)

    const matrix = await screen.findByLabelText('Matrice dei fattori Go/No-Go')
    expect(within(matrix).getByText('MAYBE')).toBeInTheDocument()
    // The test template has a single factor, so the outcome can be computed.
    expect(suggestion()).toContain('Esito calcolato dai 9 fattori: MAYBE.')
    expect(screen.queryByText('Fase a cui tornare')).toBeNull()
  })

  it('summarises the outcome of every phase and shows it in the index', async () => {
    apiWith([
      stored('p1.gate.decision.outcome', { verdict: 'go', text: 'Tutto chiaro' }),
      stored(GATE_2, { verdict: 'no_go', return_to_phase: 1, text: 'Mancano le fonti' }),
    ])
    renderRoutes(routes, `/projects/1/iterations/10?task=summary`)

    const table = await screen.findByRole('table', { name: 'Esito delle fasi' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('GO')).toBeInTheDocument()
    expect(within(rows[1]).getByText('NO-GO')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Fase I')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Mancano le fonti')).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Indice del workbook' })
    expect(within(nav).getByText('NO-GO')).toBeInTheDocument()
  })
})
