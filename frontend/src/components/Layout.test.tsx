import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoutes } from '../test/render'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows the app name in the header and renders the child route', () => {
    renderRoutes([{ element: <Layout />, children: [{ index: true, element: <p>Contenuto</p> }] }])

    expect(screen.getByRole('heading', { name: 'AI Project Workbook' })).toBeInTheDocument()
    expect(screen.getByText('Contenuto')).toBeInTheDocument()
    expect(screen.getByText('Compatibile con la metodologia CPMAI')).toBeInTheDocument()
  })
})
