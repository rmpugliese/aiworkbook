import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderRoutes } from '../test/render'
import { Home } from './Home'

function stubFetch(response: Response | Error) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response))),
  )
}

function renderHome() {
  renderRoutes([{ path: '/', element: <Home /> }])
}

describe('Home', () => {
  it('shows the backend as online when the health check succeeds', async () => {
    stubFetch(Response.json({ status: 'ok', version: '0.1.0', database: 'ok' }))
    renderHome()

    expect(await screen.findByText('Backend online · v0.1.0')).toBeInTheDocument()
  })

  it('warns when the database is unreachable', async () => {
    stubFetch(Response.json({ status: 'degraded', version: '0.1.0', database: 'error' }))
    renderHome()

    expect(
      await screen.findByText('Backend online, database non raggiungibile'),
    ).toBeInTheDocument()
  })

  it('shows the backend as unreachable when the request fails', async () => {
    stubFetch(new TypeError('Failed to fetch'))
    renderHome()

    expect(await screen.findByText('Backend non raggiungibile')).toBeInTheDocument()
  })

  it('shows the backend as unreachable on an HTTP error', async () => {
    stubFetch(new Response('Bad Gateway', { status: 502 }))
    renderHome()

    expect(await screen.findByText('Backend non raggiungibile')).toBeInTheDocument()
  })
})
