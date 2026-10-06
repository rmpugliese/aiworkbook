import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HEALTH_OK, mockApi } from '../test/api'
import { renderRoutes } from '../test/render'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows the app name, the backend status and the child route', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK })
    renderRoutes([{ element: <Layout />, children: [{ index: true, element: <p>Contenuto</p> }] }])

    expect(screen.getByRole('heading', { name: 'AI Project Workbook' })).toBeInTheDocument()
    expect(screen.getByText('Contenuto')).toBeInTheDocument()
    expect(screen.getByText('Compatibile con la metodologia CPMAI')).toBeInTheDocument()
    expect(await screen.findByText('Backend online')).toBeInTheDocument()
  })
})
