import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import type { Site } from '../api/site'
import { HEALTH_OK, mockApi, site, USER } from '../test/api'
import { renderRoutes } from '../test/render'

const ADMIN = { ...USER, is_admin: true }
const AI_SETTINGS = {
  enabled: false,
  base_url: '',
  model: '',
  has_api_key: false,
  api_key_hint: null,
  temperature: 0.4,
  max_tokens: 1200,
  location: null,
  provider_name: '',
  server_location: '',
  model_kind: '',
}

function adminApi() {
  let current: Site = site()
  return mockApi({
    'GET /api/health': HEALTH_OK,
    'GET /api/auth/me': Response.json(ADMIN),
    'GET /api/admin/users': Response.json([]),
    'GET /api/admin/ai': Response.json(AI_SETTINGS),
    'GET /api/site': () => Response.json(current),
    'PUT /api/admin/site/brand': (body) => {
      const color = (body as { brand_color: string }).brand_color
      current = { ...current, brand_color: color || null }
      return Response.json(current)
    },
    'PUT /api/admin/site/logo': () => {
      current = { ...current, logo_url: '/api/site/logo?v=2' }
      return Response.json(current)
    },
    'DELETE /api/admin/site/logo': () => {
      current = { ...current, logo_url: null }
      return Response.json(current)
    },
    'PUT /api/admin/site/legal': (body) => {
      current = { ...current, legal: { ...(body as object), complete: true } as never }
      return Response.json(current)
    },
  })
}

describe('Administration: brand and legal details', () => {
  it('saves a readable colour and refuses a light one', async () => {
    const calls = adminApi()
    renderRoutes(routes, '/admin')
    const field = await screen.findByRole('textbox', { name: 'Colore' })
    await userEvent.clear(field)
    await userEvent.type(field, '#ffdd00')
    expect(screen.getByText(/troppo chiaro/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salva colore' })).toBeDisabled()

    await userEvent.clear(field)
    await userEvent.type(field, '#7a1d4f')
    await userEvent.click(screen.getByRole('button', { name: 'Salva colore' }))
    expect(await screen.findByText('Colore salvato.')).toBeVisible()
    expect(calls.find((c) => c.path === '/api/admin/site/brand')?.body).toEqual({
      brand_color: '#7a1d4f',
    })
  })

  it('uploads and removes the logo', async () => {
    adminApi()
    const { container } = renderRoutes(routes, '/admin')
    expect(await screen.findByText('Nessun logo')).toBeVisible()
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }))
    expect(await screen.findByRole('img', { name: 'Logo attuale' })).toHaveAttribute(
      'src',
      '/api/site/logo?v=2',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Rimuovi' }))
    expect(await screen.findByText('Nessun logo')).toBeVisible()
  })

  it('saves the legal details, warning while they are missing', async () => {
    const calls = adminApi()
    renderRoutes(routes, '/admin')
    const card = (await screen.findByRole('heading', { name: 'Dati legali' })).closest(
      '.mantine-Card-root',
    ) as HTMLElement
    expect(await within(card).findByText(/Mancano dati essenziali/)).toBeVisible()
    await userEvent.type(within(card).getByRole('textbox', { name: /Titolare/ }), 'Perl Consulting')
    await userEvent.type(within(card).getByRole('textbox', { name: /^Indirizzo/ }), 'Via Roma 1')
    await userEvent.type(
      within(card).getByRole('textbox', { name: /Email per la privacy/ }),
      'p@x.it',
    )
    await userEvent.click(within(card).getByRole('button', { name: 'Salva' }))

    expect(await within(card).findByText('Dati legali salvati.')).toBeVisible()
    expect(calls.find((c) => c.path === '/api/admin/site/legal')?.body).toMatchObject({
      name: 'Perl Consulting',
      address: 'Via Roma 1',
      email: 'p@x.it',
      reviewed: false,
    })
  })
})
