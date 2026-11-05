import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, project } from '../test/api'
import { renderRoutes } from '../test/render'

describe('Moving a project', () => {
  it('offers the project as a file', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/projects/1': Response.json(project()) })
    renderRoutes(routes, '/projects/1')
    expect(await screen.findByRole('link', { name: 'Esporta' })).toHaveAttribute(
      'href',
      '/api/projects/1/export',
    )
  })

  it('imports a file and opens the new project', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([]),
      'POST /api/projects/import': Response.json(project({ id: 7, name: 'Importato' }), {
        status: 201,
      }),
      'GET /api/projects/7': Response.json(project({ id: 7, name: 'Importato' })),
    })
    const { container } = renderRoutes(routes, '/')
    await screen.findByRole('button', { name: 'Importa progetto' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['{}'], 'progetto.json', { type: 'application/json' }))

    expect(await screen.findByRole('heading', { name: 'Importato' })).toBeVisible()
    expect(calls.some((c) => c.method === 'POST' && c.path === '/api/projects/import')).toBe(true)
  })

  it('explains a rejected file', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([]),
      'POST /api/projects/import': Response.json(
        { detail: 'File non riconosciuto: usa un file esportato da questa app.' },
        { status: 422 },
      ),
    })
    const { container } = renderRoutes(routes, '/')
    await screen.findByRole('button', { name: 'Importa progetto' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['x'], 'altro.json', { type: 'application/json' }))

    expect(await screen.findByText(/File non riconosciuto/)).toBeVisible()
  })
})
