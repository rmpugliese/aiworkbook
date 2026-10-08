import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, USER } from '../test/api'
import { renderRoutes } from '../test/render'

const ADMIN = { ...USER, is_admin: true }

function account(overrides: Record<string, unknown>) {
  return {
    id: 2,
    email: 'altro@example.com',
    display_name: null,
    is_admin: false,
    created_at: '2026-10-01T09:00:00Z',
    email_verified_at: '2026-10-01T09:05:00Z',
    suspended_at: null,
    last_seen_at: '2026-10-08T08:00:00Z',
    project_count: 3,
    google_linked: false,
    ...overrides,
  }
}

describe('AdminUsersPage', () => {
  it('lists accounts and suspends one', async () => {
    let suspended = false
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': Response.json(ADMIN),
      'GET /api/admin/users': () =>
        Response.json([
          account({ id: 1, email: ADMIN.email, display_name: ADMIN.display_name, is_admin: true }),
          account({ suspended_at: suspended ? '2026-10-08T09:00:00Z' : null }),
          account({ id: 3, email: 'nuovo@example.com', email_verified_at: null, project_count: 0 }),
        ]),
      'POST /api/admin/users/2/suspend': () => {
        suspended = true
        return Response.json(account({ suspended_at: '2026-10-08T09:00:00Z' }))
      },
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/admin')

    const table = await screen.findByRole('table', { name: 'Utenti' })
    const [self, other, pending] = within(table).getAllByRole('row').slice(1)
    expect(within(self).queryByRole('button', { name: 'Sospendi' })).toBeNull() // not yourself
    expect(within(pending).getByText('Da confermare')).toBeInTheDocument()
    expect(within(pending).getByRole('button', { name: 'Conferma email' })).toBeInTheDocument()

    await user.click(within(other).getByRole('button', { name: 'Sospendi' }))

    expect(await within(other).findByText('Sospeso')).toBeInTheDocument()
    expect(within(other).getByRole('button', { name: 'Riattiva' })).toBeInTheDocument()
    expect(calls.some((c) => c.path === '/api/admin/users/2/suspend')).toBe(true)
  })

  it('shows the administration entry only to administrators', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': Response.json([]),
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/')

    await user.click(await screen.findByRole('button', { name: 'Ada Consulente' }))
    expect(await screen.findByRole('menuitem', { name: 'Esci' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Amministrazione' })).toBeNull()
  })

  it('refuses the page to other users', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/admin/users': Response.json([]) })
    renderRoutes(routes, '/admin')

    expect(await screen.findByText('Accesso negato')).toBeInTheDocument()
  })
})
