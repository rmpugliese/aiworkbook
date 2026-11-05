import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, iteration, members, mockApi, project, TEMPLATE } from '../test/api'
import { renderRoutes } from '../test/render'

const BASE = '/api/projects/1/iterations/10'
const TEXT_KEY = 'p1.objectives.problem.what'
const SHARED = project({ shared_by: 'Mario Rossi' })

function theirAnswer(overrides: Record<string, unknown> = {}) {
  return {
    question_key: TEXT_KEY,
    text: 'La sua versione',
    verdict: null,
    choices: null,
    return_to_phase: null,
    updated_at: '2026-11-05T10:00:00Z',
    updated_by_id: 2,
    updated_by_name: 'Mario Rossi',
    ...overrides,
  }
}

describe('Shared projects', () => {
  it('marks projects shared by a colleague in the list', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([
        project({ id: 1, name: 'Mio' }),
        project({ id: 2, name: 'Del collega', shared_by: 'Mario Rossi' }),
      ]),
    })
    renderRoutes(routes, '/')

    const shared = (await screen.findByText('Del collega')).closest('a') as HTMLElement
    expect(within(shared).getByText('Condiviso')).toBeInTheDocument()
    const mine = screen.getByText('Mio').closest('a') as HTMLElement
    expect(within(mine).queryByText('Condiviso')).toBeNull()
  })

  it('gives collaborators the workbook, not the project management', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects/1': Response.json(SHARED),
      'GET /api/projects/1/members': Response.json(
        members({
          owner: { name: 'Mario Rossi', email: 'mario@example.com' },
          members: [
            { id: 3, email: 'consulente@example.com', name: 'Ada Consulente', pending: false },
          ],
          can_manage: false,
        }),
      ),
    })
    renderRoutes(routes, '/projects/1')

    expect(await screen.findByText('Condiviso da Mario Rossi')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Esporta' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Modifica' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Archivia' })).toBeNull()
    expect(await screen.findByText('Proprietario')).toBeInTheDocument()
    expect(screen.queryByLabelText('Invita un collega')).toBeNull()
    expect(screen.getByRole('button', { name: 'Lascia il progetto' })).toBeInTheDocument()
  })

  it('lets the owner invite a colleague', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects/1': Response.json(project()),
      'POST /api/projects/1/members': Response.json(
        {
          member: { id: 4, email: 'nuovo@example.com', name: null, pending: true },
          notified: true,
        },
        { status: 201 },
      ),
    })
    renderRoutes(routes, '/projects/1')

    await userEvent.type(await screen.findByLabelText('Invita un collega'), 'nuovo@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Invita' }))

    expect(await screen.findByText(/appena si iscrive con questa email/)).toBeInTheDocument()
    const sent = calls.find((c) => c.method === 'POST' && c.path === '/api/projects/1/members')
    expect(sent?.body).toEqual({ email: 'nuovo@example.com' })
  })
})

describe('Editing together', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  function apiWith(answers: unknown[], put: (body: unknown) => Response) {
    return mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects/1': Response.json(SHARED),
      [`GET ${BASE}`]: Response.json(iteration()),
      'GET /api/template/1': Response.json(TEMPLATE),
      [`GET ${BASE}/answers`]: Response.json(answers),
      [`PUT ${BASE}/answers/${TEXT_KEY}`]: put,
    })
  }

  it('says who changed an answer last', async () => {
    apiWith([theirAnswer()], () => Response.json(theirAnswer()))
    renderRoutes(routes, '/projects/1/iterations/10')

    expect(await screen.findByText(/Modificata da Mario Rossi/)).toBeInTheDocument()
  })

  it('stops on a conflict and keeps the user text when asked', async () => {
    let puts = 0
    const calls = apiWith([], (body) => {
      puts += 1
      if (puts === 1) {
        return Response.json(
          {
            detail: 'Nel frattempo un collega ha modificato questa risposta.',
            current: theirAnswer(),
          },
          { status: 409 },
        )
      }
      return Response.json(theirAnswer({ ...(body as object), updated_by_id: 1 }))
    })
    renderRoutes(routes, '/projects/1/iterations/10')

    await user().type(
      await screen.findByRole('textbox', { name: 'Quale problema risolvete?' }),
      'La mia',
    )
    await act(() => vi.advanceTimersByTimeAsync(1100))
    const notice = await screen.findByText(/Mario Rossi ha modificato questa risposta/)
    const alert = notice.closest('[role="alert"]') as HTMLElement
    expect(within(alert).getByText('La sua versione')).toBeInTheDocument()

    await user().click(within(alert).getByRole('button', { name: 'Tieni la mia' }))
    await screen.findByText('Salvato')
    const last = calls.filter((c) => c.method === 'PUT').at(-1)
    expect(last?.body).toMatchObject({ text: 'La mia', base_updated_at: '2026-11-05T10:00:00Z' })
  })

  it("takes the colleague's version without saving it again", async () => {
    const calls = apiWith([], () =>
      Response.json(
        {
          detail: 'Nel frattempo un collega ha modificato questa risposta.',
          current: theirAnswer(),
        },
        { status: 409 },
      ),
    )
    renderRoutes(routes, '/projects/1/iterations/10')

    await user().type(
      await screen.findByRole('textbox', { name: 'Quale problema risolvete?' }),
      'La mia',
    )
    await act(() => vi.advanceTimersByTimeAsync(1100))
    await user().click(await screen.findByRole('button', { name: 'Usa la sua' }))
    await act(() => vi.advanceTimersByTimeAsync(2000))

    expect(screen.queryByText(/ha modificato questa risposta/)).toBeNull()
    expect(screen.getByText('La sua versione')).toBeInTheDocument()
    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(1)
  })
})
