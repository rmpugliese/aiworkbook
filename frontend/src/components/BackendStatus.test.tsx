import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { mockApi } from '../test/api'
import { renderRoutes } from '../test/render'
import { BackendStatus } from './BackendStatus'

function renderStatus() {
  renderRoutes([{ path: '/', element: <BackendStatus /> }])
}

describe('BackendStatus', () => {
  it('stays silent when the backend is healthy', async () => {
    const calls = mockApi({
      'GET /api/health': Response.json({ status: 'ok', version: '0.1.0', database: 'ok' }),
    })
    renderStatus()

    await waitFor(() => expect(calls.some((c) => c.path === '/api/health')).toBe(true))
    expect(screen.queryByText(/Backend/)).toBeNull()
  })

  it('warns when the database is unreachable', async () => {
    mockApi({
      'GET /api/health': Response.json({ status: 'degraded', version: '0.1.0', database: 'error' }),
    })
    renderStatus()

    expect(
      await screen.findByText('Backend online, database non raggiungibile'),
    ).toBeInTheDocument()
  })

  it('shows the backend as unreachable when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    renderStatus()

    expect(await screen.findByText('Backend non raggiungibile')).toBeInTheDocument()
  })

  it('shows the backend as unreachable on an HTTP error', async () => {
    mockApi({ 'GET /api/health': new Response('Bad Gateway', { status: 502 }) })
    renderStatus()

    expect(await screen.findByText('Backend non raggiungibile')).toBeInTheDocument()
  })
})
