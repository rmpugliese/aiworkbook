import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, SIGNED_OUT } from '../test/api'
import { renderRoutes } from '../test/render'

describe('Home', () => {
  it('presents the app to visitors, with the way in', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/auth/me': SIGNED_OUT.clone() })
    const { container } = renderRoutes(routes, '/')

    expect(
      await screen.findByRole('heading', { name: 'Il workbook CPMAI, finalmente digitale' }),
    ).toBeVisible()
    for (const link of screen.getAllByRole('link', { name: 'Registrati gratis' })) {
      expect(link).toHaveAttribute('href', '/register')
    }
    for (const link of screen.getAllByRole('link', { name: 'Accedi' })) {
      expect(link).toHaveAttribute('href', '/login')
    }
    expect(screen.getByRole('heading', { name: /Hai già compilato il workbook/ })).toBeVisible()
    expect(screen.getByText(/non affiliato né approvato da PMI/)).toBeVisible()
    // The video loads only when played, from this site.
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('preload', 'none')
    expect(video.getAttribute('src')).not.toMatch(/^https?:/)
    expect(screen.queryByRole('heading', { name: 'Accedi' })).toBeNull()
  })

  it('shows the projects to signed-in users', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/projects?archived=false': Response.json([]) })
    renderRoutes(routes, '/')
    expect(await screen.findByText(/Non hai ancora progetti/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /finalmente digitale/ })).toBeNull()
  })
})
