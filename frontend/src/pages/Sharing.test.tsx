import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { ShareLink } from '../api/shares'
import { routes } from '../routes'
import { HEALTH_OK, iteration, mockApi, project, TEMPLATE } from '../test/api'
import { renderRoutes } from '../test/render'

const BASE = '/api/projects/1/iterations/10'
const URL = 'http://localhost:5173/s/token-segreto'

function link(overrides: Partial<ShareLink> = {}): ShareLink {
  return {
    id: 5,
    label: 'Mario · ACME',
    status: 'active',
    created_at: '2026-10-09T08:00:00Z',
    expires_at: '2026-11-08T08:00:00Z',
    revoked_at: null,
    last_accessed_at: null,
    access_count: 0,
    ...overrides,
  }
}

function sharingApi(initial: ShareLink[], projectOverrides: Record<string, unknown> = {}) {
  let links = initial
  const calls = mockApi({
    'GET /api/health': HEALTH_OK,
    'GET /api/projects/1': Response.json(project(projectOverrides)),
    [`GET ${BASE}`]: Response.json(iteration()),
    'GET /api/template/1': Response.json(TEMPLATE),
    [`GET ${BASE}/answers`]: Response.json([]),
    [`GET ${BASE}/shares`]: () => Response.json(links),
    [`POST ${BASE}/shares`]: (body) => {
      const created = link({ label: (body as { label: string }).label })
      links = [created]
      return Response.json({ ...created, url: URL }, { status: 201 })
    },
    [`POST ${BASE}/shares/5/revoke`]: () => {
      links = [link({ status: 'revoked', revoked_at: '2026-10-09T09:00:00Z' })]
      return Response.json(links[0])
    },
    [`DELETE ${BASE}/shares/5`]: () => {
      links = []
      return new Response(null, { status: 204 })
    },
  })
  return calls
}

async function openSharing() {
  renderRoutes(routes, '/projects/1/iterations/10')
  await userEvent.click(await screen.findByRole('button', { name: 'Condividi' }))
  return screen.findByRole('dialog', { name: 'Condividi in sola lettura' })
}

describe('Read-only sharing', () => {
  it('creates a link and shows it once, ready to copy', async () => {
    const calls = sharingApi([])
    const dialog = await openSharing()
    expect(await within(dialog).findByText('Nessun link per questa iterazione.')).toBeVisible()

    await userEvent.type(within(dialog).getByRole('textbox', { name: /Destinatario/ }), 'Mario')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crea link' }))

    expect(
      await within(dialog).findByRole('textbox', { name: 'Link di condivisione' }),
    ).toHaveValue(URL)
    expect(within(dialog).getByText(/non verrà più mostrato/)).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Copia' })).toBeVisible()
    const created = calls.find((c) => c.method === 'POST' && c.path === `${BASE}/shares`)
    expect(created?.body).toEqual({ label: 'Mario', expires_in_days: 30 })

    await userEvent.click(within(dialog).getByRole('button', { name: 'Fatto' }))
    expect(within(dialog).queryByRole('textbox', { name: 'Link di condivisione' })).toBeNull()
    expect(await within(dialog).findByText('Attivo')).toBeVisible()
  })

  it('asks for confirmation before revoking, then allows deleting', async () => {
    const calls = sharingApi([link({ access_count: 2, last_accessed_at: '2026-10-09T08:30:00Z' })])
    const dialog = await openSharing()
    const row = await within(dialog).findByLabelText('Link Mario · ACME')
    expect(within(row).getByText(/Aperto 2 volte/)).toBeVisible()

    await userEvent.click(within(row).getByRole('button', { name: 'Revoca' }))
    expect(calls.some((c) => c.path.endsWith('/revoke'))).toBe(false)
    await userEvent.click(within(row).getByRole('button', { name: 'Conferma revoca' }))

    expect(await within(row).findByText('Revocato')).toBeVisible()
    await userEvent.click(within(row).getByRole('button', { name: 'Elimina' }))
    expect(await within(dialog).findByText('Nessun link per questa iterazione.')).toBeVisible()
    expect(calls.some((c) => c.method === 'DELETE')).toBe(true)
  })

  it('shows expired links and warns when the project is archived', async () => {
    sharingApi([link({ status: 'expired' })], { archived_at: '2026-10-09T07:00:00Z' })
    const dialog = await openSharing()
    expect(await within(dialog).findByText('Scaduto')).toBeVisible()
    expect(within(dialog).getByText(/i link sono sospesi/)).toBeVisible()
    expect(within(dialog).getByRole('button', { name: 'Elimina' })).toBeVisible()
  })
})
