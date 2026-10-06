import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, iteration, mockApi, project } from '../test/api'
import { renderRoutes } from '../test/render'

describe('ProjectPage', () => {
  it('enables permanent deletion only after typing the exact project name', async () => {
    const archived = project({ archived_at: '2026-10-06T11:00:00Z' })
    let deleted = false
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      // Like the real API: once deleted, the project is gone.
      'GET /api/projects/1': () =>
        deleted
          ? Response.json({ detail: 'project 1 not found' }, { status: 404 })
          : Response.json(archived),
      'DELETE /api/projects/1': () => {
        deleted = true
        return new Response(null, { status: 204 })
      },
      'GET /api/projects?archived=false': Response.json([]),
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/projects/1')

    await user.click(await screen.findByRole('button', { name: 'Elimina definitivamente' }))
    const confirm = screen.getAllByRole('button', { name: 'Elimina definitivamente' }).at(-1)!
    const input = screen.getByLabelText(/scrivi il nome del progetto/)

    await user.type(input, 'churn')
    expect(confirm).toBeDisabled()
    await user.clear(input)
    await user.type(input, 'Churn')
    expect(confirm).toBeEnabled()
    await user.click(confirm)

    expect(await screen.findByRole('heading', { name: 'Progetti' })).toBeInTheDocument()
    expect(calls.find((call) => call.method === 'DELETE')?.body).toEqual({ confirm_name: 'Churn' })
  })

  it('offers archiving, not deletion, for an active project', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/projects/1': Response.json(project()) })
    renderRoutes(routes, '/projects/1')

    expect(await screen.findByRole('button', { name: 'Archivia' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Elimina definitivamente' })).toBeNull()
  })

  it('creates an iteration copied from an earlier one', async () => {
    const detail = project({
      iteration_count: 2,
      iterations: [iteration(), iteration({ id: 11, number: 2, title: 'Pilota' })],
    })
    const created = iteration({ id: 12, number: 3, title: 'Iterazione 3' })
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects/1': Response.json(detail),
      'POST /api/projects/1/iterations': Response.json(created, { status: 201 }),
      'GET /api/projects/1/iterations/12': Response.json(created),
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/projects/1')

    await user.click(await screen.findByRole('button', { name: 'Nuova iterazione' }))
    expect(screen.getByLabelText(/Titolo/)).toHaveValue('Iterazione 3')
    await user.click(screen.getByLabelText("Copia le risposte di un'iterazione precedente"))
    await user.click(screen.getByRole('button', { name: 'Crea iterazione' }))

    expect(await screen.findByRole('heading', { name: '3. Iterazione 3' })).toBeInTheDocument()
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      title: 'Iterazione 3',
      user_story: null,
      copy_from_iteration_id: 11,
    })
  })
})
