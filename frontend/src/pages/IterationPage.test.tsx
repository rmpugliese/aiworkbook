import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, iteration, mockApi, project, TEMPLATE } from '../test/api'
import { renderRoutes } from '../test/render'

const BASE = '/api/projects/1/iterations/10'
const TEXT_KEY = 'p1.objectives.problem.what'

function apiWith(extra: Record<string, Response | ((body: unknown) => Response)> = {}) {
  return mockApi({
    'GET /api/health': HEALTH_OK,
    'GET /api/projects/1': Response.json(project()),
    [`GET ${BASE}`]: Response.json(iteration({ user_story: 'Una storia' })),
    'GET /api/template/1': Response.json(TEMPLATE),
    [`GET ${BASE}/answers`]: Response.json([]),
    ...extra,
  })
}

/** Echoes a PUT body back as the saved answer. */
function echo(key: string) {
  return (body: unknown) =>
    Response.json({
      question_key: key,
      text: null,
      verdict: null,
      choices: null,
      return_to_phase: null,
      ...(body as object),
      updated_at: '2026-10-06T12:00:00Z',
    })
}

describe('IterationPage', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  it('opens the first task with its guidance and the workbook index', async () => {
    apiWith()
    renderRoutes(routes, '/projects/1/iterations/10')

    expect(await screen.findByRole('heading', { name: 'Problema', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Guida del task problema.')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Indice del workbook' })
    expect(within(nav).getByText('Fase I · Comprensione del business')).toBeInTheDocument()
    expect(within(nav).getByText('0/3')).toBeInTheDocument()
  })

  it('saves a text answer once, a second after the last keystroke', async () => {
    const calls = apiWith({ [`PUT ${BASE}/answers/${TEXT_KEY}`]: echo(TEXT_KEY) })
    renderRoutes(routes, '/projects/1/iterations/10')
    const field = await screen.findByRole('textbox', { name: 'Quale problema risolvete?' })

    await user().type(field, 'Ridurre')
    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(0)
    await act(() => vi.advanceTimersByTimeAsync(1100))

    expect(await screen.findByText('Salvato')).toBeInTheDocument()
    const puts = calls.filter((c) => c.method === 'PUT')
    expect(puts).toHaveLength(1)
    expect(puts[0].body).toEqual({
      text: 'Ridurre',
      verdict: null,
      choices: null,
      return_to_phase: null,
    })
    const nav = screen.getByRole('navigation', { name: 'Indice del workbook' })
    expect(within(nav).getByText('1/3')).toBeInTheDocument()
  })

  it('shows a save error and retries on request', async () => {
    let fail = true
    apiWith({
      [`PUT ${BASE}/answers/${TEXT_KEY}`]: (body) =>
        fail ? new Response('down', { status: 503 }) : echo(TEXT_KEY)(body),
    })
    renderRoutes(routes, '/projects/1/iterations/10')
    const field = await screen.findByRole('textbox', { name: 'Quale problema risolvete?' })

    await user().type(field, 'Testo')
    await act(() => vi.advanceTimersByTimeAsync(1100))
    expect(await screen.findByText('Errore nel salvataggio')).toBeInTheDocument()

    fail = false
    await user().click(screen.getByRole('button', { name: 'Riprova' }))
    expect(await screen.findByText('Salvato')).toBeInTheDocument()
  })

  it('saves pending edits immediately when moving to the next task', async () => {
    const calls = apiWith({ [`PUT ${BASE}/answers/${TEXT_KEY}`]: echo(TEXT_KEY) })
    renderRoutes(routes, '/projects/1/iterations/10')
    const field = await screen.findByRole('textbox', { name: 'Quale problema risolvete?' })

    await user().type(field, 'Al volo')
    await user().click(screen.getByRole('link', { name: 'Task successivo: Pattern' }))

    expect(await screen.findByRole('heading', { name: 'Pattern', level: 2 })).toBeInTheDocument()
    expect(calls.filter((c) => c.method === 'PUT').map((c) => c.body)).toEqual([
      { text: 'Al volo', verdict: null, choices: null, return_to_phase: null },
    ])
  })

  it('saves AI patterns and a phase gate verdict', async () => {
    const calls = apiWith({
      [`PUT ${BASE}/answers/p1.objectives.patterns.which`]: echo('p1.objectives.patterns.which'),
      [`PUT ${BASE}/answers/p1.gate.decision.outcome`]: echo('p1.gate.decision.outcome'),
    })
    renderRoutes(routes, '/projects/1/iterations/10?task=1.objectives.patterns')

    await user().click(await screen.findByLabelText('Analisi predittiva'))
    await act(() => vi.advanceTimersByTimeAsync(1100))
    await user().click(screen.getByRole('link', { name: 'Task successivo: Esito della Fase I' }))
    await user().click(await screen.findByText('NO-GO'))
    await act(() => vi.advanceTimersByTimeAsync(1100))

    await screen.findByText('Salvato')
    const bodies = calls.filter((c) => c.method === 'PUT').map((c) => [c.path, c.body])
    expect(bodies).toEqual([
      [
        `${BASE}/answers/p1.objectives.patterns.which`,
        { text: null, verdict: null, choices: ['predictive'], return_to_phase: null },
      ],
      [
        `${BASE}/answers/p1.gate.decision.outcome`,
        { text: null, verdict: 'no_go', choices: null, return_to_phase: null },
      ],
    ])
  })

  it('reopens the task named in the URL, with its stored answer', async () => {
    apiWith({
      [`GET ${BASE}/answers`]: Response.json([
        {
          question_key: 'p2.quality.verify.factor',
          text: 'Dati incompleti',
          verdict: 'maybe',
          choices: null,
          return_to_phase: null,
          updated_at: '2026-10-06T12:00:00Z',
        },
      ]),
    })
    renderRoutes(routes, '/projects/1/iterations/10?task=2.quality.verify')

    expect(await screen.findByRole('heading', { name: 'Verifica qualità' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Note e motivazione/ })).toHaveValue(
      'Dati incompleti',
    )
    expect(
      screen.getByRole('link', { name: 'Task successivo: Passaggio alla Fase III' }),
    ).toBeInTheDocument()
  })
})

describe('IterationPage export', () => {
  it('links the PDF report of the iteration', async () => {
    apiWith()
    renderRoutes(routes, '/projects/1/iterations/10')

    const link = await screen.findByRole('link', { name: 'Scarica PDF' })
    expect(link).toHaveAttribute('href', `${BASE}/export.pdf`)
    expect(link).toHaveAttribute('download')
  })
})
