import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, iteration, mockApi, project, TEMPLATE, USER } from '../test/api'
import { renderRoutes } from '../test/render'

const BASE = '/api/projects/1/iterations/10'
const TEXT_KEY = 'p1.objectives.problem.what'
const AVAILABLE = Response.json({
  available: true,
  model: 'llama3.1:8b',
  location: 'remoto',
  host: 'openrouter.ai',
})

function stream(...events: [string, object][]) {
  const body = events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
  return new Response(body.join(''), { headers: { 'content-type': 'text/event-stream' } })
}

function iterationApi(assist: Response | (() => Response)) {
  return mockApi({
    'GET /api/health': HEALTH_OK,
    'GET /api/ai/status': AVAILABLE,
    'GET /api/projects/1': Response.json(project({ ai_enabled_at: '2026-10-08T09:00:00Z' })),
    [`GET ${BASE}`]: Response.json(iteration()),
    'GET /api/template/1': Response.json(TEMPLATE),
    [`GET ${BASE}/answers`]: Response.json([]),
    [`POST ${BASE}/assist`]: assist,
    [`PUT ${BASE}/answers/${TEXT_KEY}`]: (body) =>
      Response.json({
        question_key: TEXT_KEY,
        verdict: null,
        choices: null,
        return_to_phase: null,
        ...(body as object),
        updated_at: '2026-10-08T10:00:00Z',
      }),
  })
}

describe('AI assistant', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())
  const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  it('asks for consent before turning the assistant on for a project', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/ai/status': AVAILABLE,
      'GET /api/projects/1': Response.json(project()),
      'POST /api/projects/1/ai/enable': Response.json(
        project({ ai_enabled_at: '2026-10-08T09:00:00Z' }),
      ),
    })
    renderRoutes(routes, '/projects/1')

    await user().click(await screen.findByRole('button', { name: "Attiva l'assistente" }))
    const dialog = await screen.findByRole('dialog', { name: "Attivare l'assistente?" })
    expect(within(dialog).getByText('openrouter.ai')).toBeInTheDocument()
    expect(within(dialog).getByText(/servizio remoto/)).toBeInTheDocument()
    await user().click(within(dialog).getByRole('button', { name: 'Attiva' }))

    expect(calls.some((c) => c.path === '/api/projects/1/ai/enable')).toBe(true)
  })

  it('streams a suggestion and applies it only on request', async () => {
    const calls = iterationApi(() =>
      stream(['delta', { text: 'Ridurre ' }], ['delta', { text: 'gli abbandoni.' }], ['done', {}]),
    )
    renderRoutes(routes, '/projects/1/iterations/10')
    const field = await screen.findByRole('textbox', { name: 'Quale problema risolvete?' })
    await user().type(field, 'Bozza')
    expect(field).toHaveValue('Bozza')
    await act(() => vi.advanceTimersByTimeAsync(1100))

    await user().click(screen.getByRole('button', { name: 'Assistente' }))
    await user().click(await screen.findByRole('menuitem', { name: 'Suggerisci una bozza' }))

    const panel = await screen.findByLabelText("Proposta dell'assistente")
    expect(await within(panel).findByText('Ridurre gli abbandoni.')).toBeInTheDocument()
    // Leaving the field for the menu shows it formatted; nothing has been applied yet.
    const view = screen.getByRole('button', { name: 'Modifica: Quale problema risolvete?' })
    expect(view).toHaveTextContent(/^Bozza$/)
    expect(calls.find((c) => c.path === `${BASE}/assist`)?.body).toEqual({
      question_key: TEXT_KEY,
      action: 'suggest',
      text: 'Bozza',
      verdict: null,
    })

    await user().click(within(panel).getByRole('button', { name: 'Aggiungi in fondo' }))
    expect(within(view).getByText('Ridurre gli abbandoni.').tagName).toBe('P') // own paragraph
    await user().click(view)
    expect(screen.getByRole('textbox', { name: 'Quale problema risolvete?' })).toHaveValue(
      'Bozza\n\nRidurre gli abbandoni.',
    )
    await act(() => vi.advanceTimersByTimeAsync(1100))
    const saved = calls.filter((c) => c.method === 'PUT').at(-1)?.body as { text: string }
    expect(saved.text).toBe('Bozza\n\nRidurre gli abbandoni.')
  })

  it('shows a review without offering to apply it', async () => {
    iterationApi(() =>
      stream(
        ['delta', { text: '- Manca una misura.\n- ' }],
        ['delta', { text: '**KPI** assenti' }],
        ['done', {}],
      ),
    )
    renderRoutes(routes, '/projects/1/iterations/10')

    await user().click(await screen.findByRole('button', { name: 'Assistente' }))
    await user().click(await screen.findByRole('menuitem', { name: 'Critica e domande' }))

    const panel = await screen.findByLabelText("Proposta dell'assistente")
    // Formatted: a list with bold text, not raw Markdown.
    expect(await within(panel).findByText('Manca una misura.')).toBeInTheDocument()
    expect(within(panel).getAllByRole('listitem')).toHaveLength(2)
    expect(within(panel).getByText("Generato dall'AI · da verificare")).toBeInTheDocument()
    expect(within(panel).getByText('KPI').tagName).toBe('STRONG')
    expect(within(panel).queryByRole('button', { name: 'Sostituisci' })).toBeNull()
    expect(within(panel).getByRole('button', { name: 'Chiudi' })).toBeInTheDocument()
  })

  it('explains an empty answer instead of showing an empty proposal', async () => {
    iterationApi(() => stream(['done', {}]))
    renderRoutes(routes, '/projects/1/iterations/10')
    await user().click(await screen.findByRole('button', { name: 'Assistente' }))
    await user().click(await screen.findByRole('menuitem', { name: 'Suggerisci una bozza' }))
    expect(await screen.findByText(/non ha prodotto testo/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sostituisci' })).toBeNull()
  })

  it('reports service errors and leaves the field untouched', async () => {
    iterationApi(() => stream(['error', { detail: 'Il modello non ha risposto in tempo.' }]))
    renderRoutes(routes, '/projects/1/iterations/10')
    const field = await screen.findByRole('textbox', { name: 'Quale problema risolvete?' })

    await user().click(screen.getByRole('button', { name: 'Assistente' }))
    await user().click(await screen.findByRole('menuitem', { name: 'Suggerisci una bozza' }))

    expect(await screen.findByText('Il modello non ha risposto in tempo.')).toBeInTheDocument()
    expect(field).toHaveValue('')
  })

  it('offers no assistant when the project has not enabled it', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/ai/status': AVAILABLE,
      'GET /api/projects/1': Response.json(project()),
      [`GET ${BASE}`]: Response.json(iteration()),
      'GET /api/template/1': Response.json(TEMPLATE),
      [`GET ${BASE}/answers`]: Response.json([]),
    })
    renderRoutes(routes, '/projects/1/iterations/10')

    await screen.findByRole('textbox', { name: 'Quale problema risolvete?' })
    expect(screen.queryByRole('button', { name: 'Assistente' })).toBeNull()
  })

  it('lets administrators configure the endpoint without ever showing the key', async () => {
    const saved = {
      enabled: true,
      base_url: 'http://localhost:11434/v1',
      model: 'llama3.1:8b',
      has_api_key: true,
      api_key_hint: 'ab12',
      temperature: 0.4,
      max_tokens: 1200,
      location: 'locale',
    }
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': Response.json({ ...USER, is_admin: true }),
      'GET /api/admin/users': Response.json([]),
      'GET /api/admin/ai': Response.json(saved),
      'PUT /api/admin/ai': (body) => Response.json({ ...saved, ...(body as object) }),
      'POST /api/admin/ai/test': Response.json({
        ok: true,
        seconds: 0.4,
        detail: 'Il modello risponde.',
      }),
    })
    renderRoutes(routes, '/admin')

    expect(await screen.findByText(/Impostata \(…ab12\)/)).toBeInTheDocument()
    const model = screen.getByRole('textbox', { name: /^Modello/ })
    await user().clear(model)
    await user().type(model, 'mistral-small')
    const aiCard = screen
      .getByRole('heading', { name: 'Assistente AI' })
      .closest('.mantine-Card-root') as HTMLElement
    await user().click(within(aiCard).getByRole('button', { name: 'Salva' }))

    expect(await screen.findByText('Configurazione salvata.')).toBeInTheDocument()
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({
      model: 'mistral-small',
      api_key: null, // blank field: keep the stored key
      clear_api_key: false,
    })
    await user().click(screen.getByRole('button', { name: 'Prova connessione' }))
    expect(await screen.findByText(/Il modello risponde\. \(0\.4 s\)/)).toBeInTheDocument()
  })
})
