import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../../routes'
import { HEALTH_OK, mockApi, project, SIGNED_OUT, USER } from '../../test/api'
import { renderRoutes } from '../../test/render'

const PROJECTS = { 'GET /api/projects?archived=false': Response.json([project()]) }

describe('authentication', () => {
  it('sends signed-out visitors to sign in, then back to the page they asked for', async () => {
    let signedIn = false
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': () => (signedIn ? Response.json(USER) : SIGNED_OUT.clone()),
      'POST /api/auth/login': () => {
        signedIn = true
        return Response.json(USER)
      },
      'GET /api/projects/1': Response.json(project()),
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/projects/1')

    expect(await screen.findByRole('heading', { name: 'Accedi' })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Email/), 'consulente@example.com')
    await user.type(screen.getByLabelText(/Password/, { selector: 'input' }), 'una-password')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))

    expect(await screen.findByRole('heading', { name: 'Churn', level: 1 })).toBeInTheDocument()
    // The header stays mounted across the sign-in and must show the user too.
    expect(screen.getByRole('button', { name: 'Ada Consulente' })).toBeInTheDocument()
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      email: 'consulente@example.com',
      password: 'una-password',
    })
  })

  it('offers a new confirmation link when the email is not confirmed', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': SIGNED_OUT,
      'POST /api/auth/login': Response.json(
        { detail: 'Devi ancora confermare il tuo indirizzo email.' },
        { status: 403 },
      ),
      'POST /api/auth/resend-verification': Response.json({ detail: 'ok' }, { status: 202 }),
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/login')

    await user.type(await screen.findByLabelText(/Email/), 'nuova@example.com')
    await user.type(screen.getByLabelText(/Password/, { selector: 'input' }), 'una-password')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))
    await user.click(await screen.findByRole('button', { name: /Invia di nuovo il link/ }))

    expect(await screen.findByText(/Ti abbiamo inviato un nuovo link/)).toBeInTheDocument()
    expect(calls.at(-1)).toMatchObject({
      path: '/api/auth/resend-verification',
      body: { email: 'nuova@example.com' },
    })
  })

  it('registers and asks to check the inbox', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': SIGNED_OUT,
      'POST /api/auth/register': Response.json({ detail: 'ok' }, { status: 202 }),
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/register')

    await user.type(await screen.findByLabelText(/^Email/), 'nuova@example.com')
    const password = screen.getByLabelText(/^Password/, { selector: 'input' })
    await user.type(password, 'corta')
    expect(screen.getByRole('button', { name: 'Registrati' })).toBeDisabled()
    await user.type(password, '-ma-ora-lunga')
    await user.click(screen.getByRole('button', { name: 'Registrati' }))

    expect(
      await screen.findByRole('heading', { name: 'Controlla la tua email' }),
    ).toBeInTheDocument()
    expect(screen.getByText('nuova@example.com')).toBeInTheDocument()
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      email: 'nuova@example.com',
      password: 'corta-ma-ora-lunga',
      display_name: null,
    })
  })

  it('confirms the email from the link once and signs in', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'POST /api/auth/verify-email': Response.json(USER),
      ...PROJECTS,
    })
    renderRoutes(routes, '/verify-email?token=abc')

    expect(await screen.findByRole('heading', { name: 'Progetti' })).toBeInTheDocument()
    const verifications = calls.filter((c) => c.path === '/api/auth/verify-email')
    expect(verifications).toEqual([
      { method: 'POST', path: '/api/auth/verify-email', body: { token: 'abc' } },
    ])
  })

  it('sets a new password only when both entries match', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'POST /api/auth/password-reset/confirm': new Response(null, { status: 204 }),
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/reset-password?token=tok')

    await user.type(await screen.findByLabelText(/^Nuova password/), 'nuova-password-1')
    await user.type(screen.getByLabelText(/^Ripeti la password/), 'nuova-password-2')
    expect(screen.getByText('Le due password non coincidono')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salva la nuova password' })).toBeDisabled()

    await user.clear(screen.getByLabelText(/^Ripeti la password/))
    await user.type(screen.getByLabelText(/^Ripeti la password/), 'nuova-password-1')
    await user.click(screen.getByRole('button', { name: 'Salva la nuova password' }))

    expect(await screen.findByRole('heading', { name: 'Password aggiornata' })).toBeInTheDocument()
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      token: 'tok',
      password: 'nuova-password-1',
    })
  })

  it('signs out from the user menu', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'POST /api/auth/logout': new Response(null, { status: 204 }),
      ...PROJECTS,
    })
    const user = userEvent.setup()
    renderRoutes(routes, '/')

    await user.click(await screen.findByRole('button', { name: 'Ada Consulente' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Esci' }))

    expect(await screen.findByRole('heading', { name: 'Accedi' })).toBeInTheDocument()
  })

  it('returns to sign-in when the session expires during use', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/projects?archived=false': SIGNED_OUT,
    })
    renderRoutes(routes, '/')

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Accedi' })).toBeInTheDocument())
  })

  it('shows Google sign-in only when it is configured', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': SIGNED_OUT,
      'GET /api/auth/providers': Response.json({ google: true }),
    })
    renderRoutes(routes, '/login')

    const google = await screen.findByRole('link', { name: 'Accedi con Google' })
    expect(google).toHaveAttribute('href', '/api/auth/google/login')
  })
})
