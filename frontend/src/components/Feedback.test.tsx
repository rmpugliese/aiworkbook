import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, SIGNED_OUT, site } from '../test/api'
import { renderRoutes } from '../test/render'

const WITH_CONTACT = Response.json(
  site({ legal: { ...site().legal, contact_email: 'info@example.com' } }),
)

async function openFromMenu() {
  await userEvent.click(await screen.findByRole('button', { name: 'Menu di Ada Consulente' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: "Suggerisci un'idea" }))
  return screen.findByRole('dialog', { name: "Suggerisci un'idea" })
}

describe('Suggestions', () => {
  it('sends a suggestion from the user menu', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/site': WITH_CONTACT.clone(),
      'GET /api/projects?archived=false': Response.json([]),
      'POST /api/feedback': new Response(null, { status: 204 }),
    })
    renderRoutes(routes, '/')
    await openFromMenu()

    const send = screen.getByRole('button', { name: 'Invia' })
    await userEvent.type(screen.getByRole('textbox', { name: 'Il tuo messaggio' }), 'Breve')
    expect(send).toBeDisabled()
    await userEvent.click(screen.getByText('Problema'))
    await userEvent.type(screen.getByRole('textbox', { name: 'Il tuo messaggio' }), ' ma chiaro.')
    await userEvent.click(send)

    expect(await screen.findByText('Grazie!')).toBeVisible()
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      kind: 'problem',
      message: 'Breve ma chiaro.',
    })
  })

  it('shows why a suggestion was not sent', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/site': WITH_CONTACT.clone(),
      'GET /api/projects?archived=false': Response.json([]),
      'POST /api/feedback': Response.json(
        { detail: "Hai inviato molti suggerimenti: riprova tra un'ora." },
        { status: 429 },
      ),
    })
    renderRoutes(routes, '/')
    await openFromMenu()
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Il tuo messaggio' }),
      'Un suggerimento qualsiasi.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Invia' }))
    expect(await screen.findByText(/riprova tra un'ora/)).toBeVisible()
  })

  it('is not offered without a contact address', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/projects?archived=false': Response.json([]) })
    renderRoutes(routes, '/')
    await userEvent.click(await screen.findByRole('button', { name: 'Menu di Ada Consulente' }))
    expect(await screen.findByRole('menuitem', { name: 'Profilo' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: "Suggerisci un'idea" })).toBeNull()
  })

  it('shows visitors the contact address on the home page', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': SIGNED_OUT.clone(),
      'GET /api/site': WITH_CONTACT.clone(),
    })
    renderRoutes(routes, '/')
    expect(await screen.findByRole('link', { name: 'info@example.com' })).toHaveAttribute(
      'href',
      'mailto:info@example.com',
    )
    expect(screen.queryByRole('button', { name: "Suggerisci un'idea" })).toBeNull()
  })
})
