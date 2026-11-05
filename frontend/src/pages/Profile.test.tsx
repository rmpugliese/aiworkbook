import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, USER } from '../test/api'
import { renderRoutes } from '../test/render'

describe('Profile', () => {
  it('saves the display name and has no brand settings any more', async () => {
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
})
