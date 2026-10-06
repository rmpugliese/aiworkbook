import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, project } from '../test/api'
import { renderRoutes } from '../test/render'

describe('ProjectsPage', () => {
  it('invites to create the first project when there are none', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/projects?archived=false': Response.json([]) })
    renderRoutes(routes)

    expect(await screen.findByText(/Non hai ancora progetti/)).toBeInTheDocument()
  })

  it('lists projects with client and iteration count', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([
        project({ iteration_count: 2 }),
        project({ id: 2, name: 'Triage', client_name: null }),
      ]),
    })
    renderRoutes(routes)

    expect(await screen.findByText('Churn')).toBeInTheDocument()
    expect(screen.getByText('ACME')).toBeInTheDocument()
    expect(screen.getByText(/2 iterazioni/)).toBeInTheDocument()
    expect(screen.getByText('Nessun cliente indicato')).toBeInTheDocument()
  })

  it('creates a project and opens it', async () => {
    const created = project({ id: 7, name: 'Nuovo' })
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([]),
      'POST /api/projects': Response.json(created, { status: 201 }),
      'GET /api/projects/7': Response.json(created),
    })
    const user = userEvent.setup()
    renderRoutes(routes)

    await user.click(await screen.findByRole('button', { name: 'Nuovo progetto' }))
    await user.type(screen.getByLabelText(/Nome del progetto/), 'Nuovo')
    await user.type(screen.getByLabelText('Azienda cliente'), 'Beta Srl')
    await user.click(screen.getByRole('button', { name: 'Crea progetto' }))

    expect(await screen.findByRole('heading', { name: 'Nuovo', level: 1 })).toBeInTheDocument()
    const post = calls.find((call) => call.method === 'POST')
    expect(post?.body).toEqual({ name: 'Nuovo', client_name: 'Beta Srl', description: '' })
  })
})
