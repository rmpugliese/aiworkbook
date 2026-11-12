import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, site, USER } from '../test/api'
import { renderRoutes } from '../test/render'

describe('Profile', () => {
  it('saves the display name and has no site brand settings', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'PATCH /api/auth/me': (body) => Response.json({ ...USER, ...(body as object) }),
    })
    renderRoutes(routes, '/profile')
    const card = (await screen.findByRole('heading', { name: 'Dati personali' })).closest('form')!
    const name = within(card).getByRole('textbox', { name: /Nome visualizzato/ })
    await userEvent.clear(name)
    await userEvent.type(name, 'Studio Rossi')
    await userEvent.click(within(card).getByRole('button', { name: 'Salva' }))

    expect(await screen.findByText('Nome salvato.')).toBeVisible()
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ display_name: 'Studio Rossi' })
    expect(screen.queryByRole('heading', { name: 'Logo' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Colore principale' })).toBeNull()
  })

  it('uploads and removes the own logo for PDFs', async () => {
    let user = { ...USER }
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': () => Response.json(user),
      'PUT /api/auth/me/logo': () => {
        user = { ...user, logo_url: '/api/auth/me/logo?v=2' }
        return Response.json(user)
      },
      'DELETE /api/auth/me/logo': () => {
        user = { ...user, logo_url: null }
        return Response.json(user)
      },
    })
    const { container } = renderRoutes(routes, '/profile')
    const card = (await screen.findByRole('heading', { name: 'Il tuo logo nei PDF' })).closest(
      '.mantine-Card-root',
    ) as HTMLElement
    expect(within(card).getByText('Nessun logo')).toBeVisible()
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }))
    expect(await within(card).findByRole('img', { name: 'Logo attuale' })).toHaveAttribute(
      'src',
      '/api/auth/me/logo?v=2',
    )
    expect(calls.some((c) => c.method === 'PUT' && c.path === '/api/auth/me/logo')).toBe(true)
    await userEvent.click(within(card).getByRole('button', { name: 'Rimuovi' }))
    expect(await within(card).findByText('Nessun logo')).toBeVisible()
  })

  it('shows the invitation to donate only when the site has one', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/site': Response.json(
        site({ donation: { text: 'Sostieni chi aiuta.', url: 'https://example.org/dona/' } }),
      ),
    })
    renderRoutes(routes, '/profile')
    expect(await screen.findByText('Sostieni chi aiuta.')).toBeVisible()
    const link = screen.getByRole('link', { name: /Sostieni l'associazione/ })
    expect(link).toHaveAttribute('href', 'https://example.org/dona/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows no invitation by default', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK })
    renderRoutes(routes, '/profile')
    await screen.findByRole('heading', { name: 'Il tuo logo nei PDF' })
    expect(screen.queryByRole('link', { name: /Sostieni/ })).toBeNull()
  })
})
