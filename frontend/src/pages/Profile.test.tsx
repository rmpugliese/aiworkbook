import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { User } from '../api/auth'
import { routes } from '../routes'
import { HEALTH_OK, mockApi, USER } from '../test/api'
import { renderRoutes } from '../test/render'

function profileApi(user: Record<string, unknown> = {}) {
  let current: User = { ...USER, ...user }
  return mockApi({
    'GET /api/health': HEALTH_OK,
    'GET /api/auth/me': () => Response.json(current),
    'PATCH /api/auth/me': (body) => {
      const patch = body as Record<string, string>
      current = {
        ...current,
        ...patch,
        brand_color: patch.brand_color === '' ? null : (patch.brand_color ?? current.brand_color),
      }
      return Response.json(current)
    },
    'PUT /api/auth/me/logo': () => {
      current = { ...current, logo_url: '/api/auth/me/logo?v=2' }
      return Response.json(current)
    },
    'DELETE /api/auth/me/logo': () => {
      current = { ...current, logo_url: null }
      return Response.json(current)
    },
  })
}

describe('Profile and brand', () => {
  it('saves a readable colour and refuses a light one', async () => {
    const calls = profileApi()
    renderRoutes(routes, '/profile')
    const field = await screen.findByRole('textbox', { name: 'Colore' })

    await userEvent.clear(field)
    await userEvent.type(field, '#ffdd00')
    expect(screen.getByText(/troppo chiaro/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salva colore' })).toBeDisabled()

    await userEvent.clear(field)
    await userEvent.type(field, '#7a1d4f')
    expect(screen.getByText(/leggibile/)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Salva colore' }))

    expect(await screen.findByText('Colore salvato.')).toBeVisible()
    const saved = calls.find((c) => c.method === 'PATCH')
    expect(saved?.body).toEqual({ brand_color: '#7a1d4f' })
    expect(screen.getByRole('button', { name: 'Ripristina il predefinito' })).toBeVisible()
  })

  it('uploads and removes the logo', async () => {
    const calls = profileApi()
    const { container } = renderRoutes(routes, '/profile')
    expect(await screen.findByText('Nessun logo')).toBeVisible()

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.accept).toBe('image/png,image/jpeg,image/svg+xml')
    await userEvent.upload(input, new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }))

    expect(await screen.findByRole('img', { name: 'Logo attuale' })).toHaveAttribute(
      'src',
      '/api/auth/me/logo?v=2',
    )
    const upload = calls.find((c) => c.method === 'PUT')
    expect(upload?.path).toBe('/api/auth/me/logo')

    await userEvent.click(screen.getByRole('button', { name: 'Rimuovi' }))
    expect(await screen.findByText('Nessun logo')).toBeVisible()
  })

  it('saves the display name', async () => {
    const calls = profileApi()
    renderRoutes(routes, '/profile')
    const card = (await screen.findByRole('heading', { name: 'Dati personali' })).closest('form')!
    const name = within(card).getByRole('textbox', { name: /Nome visualizzato/ })
    await userEvent.clear(name)
    await userEvent.type(name, 'Studio Rossi')
    await userEvent.click(within(card).getByRole('button', { name: 'Salva' }))

    expect(await screen.findByText('Nome salvato.')).toBeVisible()
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ display_name: 'Studio Rossi' })
  })
})
