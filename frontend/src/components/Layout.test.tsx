import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HEALTH_OK, mockApi, site } from '../test/api'
import { renderRoutes } from '../test/render'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows the app name, the user menu and the child route', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK })
    renderRoutes([{ element: <Layout />, children: [{ index: true, element: <p>Contenuto</p> }] }])

    expect(screen.getByRole('heading', { name: 'AI Project Workbook' })).toBeInTheDocument()
    expect(screen.getByText('Contenuto')).toBeInTheDocument()
    expect(screen.getByText('Compatibile con la metodologia CPMAI')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Menu di Ada Consulente' })).toBeVisible()
  })

  it("shows the installation's logo instead of the app name", async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/site': Response.json(site({ logo_url: '/api/site/logo?v=1' })),
    })
    renderRoutes([{ element: <Layout />, children: [{ index: true, element: <p>Contenuto</p> }] }])

    expect(await screen.findByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      '/api/site/logo?v=1',
    )
    expect(screen.queryByRole('heading', { name: 'AI Project Workbook' })).toBeNull()
  })
})
