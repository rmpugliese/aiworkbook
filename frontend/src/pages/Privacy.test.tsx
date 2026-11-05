import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { routes } from '../routes'
import { HEALTH_OK, mockApi, SIGNED_OUT, site, USER } from '../test/api'
import { renderRoutes } from '../test/render'

describe('Privacy and data rights', () => {
  it('shows the legal pages to everyone, marked as drafts', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/auth/me': SIGNED_OUT })
    renderRoutes(routes, '/privacy')
    expect(await screen.findByRole('heading', { name: 'Informativa sulla privacy' })).toBeVisible()
    expect(await screen.findByText(/in attesa di revisione legale/)).toBeVisible()
    // Missing details show as visible placeholders.
    expect(screen.getAllByText('[titolare]').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByRole('link', { name: 'Termini' })
        .some((a) => a.getAttribute('href') === '/terms'),
    ).toBe(true)
  })

  it('shows the configured data controller and the AI service', async () => {
    mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': SIGNED_OUT,
      'GET /api/site': Response.json(
        site({
          legal: {
            name: 'Perl Consulting',
            address: 'Via Roma 1, Trieste',
            vat_id: 'IT0123',
            email: 'privacy@perl.example',
            pec: '',
            court: 'Trieste',
            reviewed: true,
            complete: true,
          },
          ai: {
            available: true,
            model: 'mistral-small',
            provider_name: 'Fornitore UE',
            server_location: 'Francia (UE)',
            model_kind: 'open weight',
            location: 'remoto',
          },
        }),
      ),
    })
    renderRoutes(routes, '/ai')
    expect(
      await screen.findByRole('heading', { name: "Uso dell'intelligenza artificiale" }),
    ).toBeVisible()
    const table = await screen.findByRole('table', { name: 'Servizio AI in uso' })
    expect(table).toHaveTextContent('Fornitore UE')
    expect(table).toHaveTextContent('Francia (UE)')
    expect(table).toHaveTextContent('mistral-small')
    expect(screen.queryByText(/in attesa di revisione legale/)).toBeNull() // reviewed

    await userEvent.click(screen.getAllByRole('link', { name: 'Privacy' })[0])
    expect(await screen.findByText('Perl Consulting')).toBeVisible()
    expect(screen.queryByText('[titolare]')).toBeNull()
  })

  it('lists the cookies in the footer panel', async () => {
    mockApi({ 'GET /api/health': HEALTH_OK, 'GET /api/auth/me': SIGNED_OUT })
    renderRoutes(routes, '/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Cookie' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cookie' })
    for (const name of ['session', 'csrf_token', 'oauth_state']) {
      expect(within(dialog).getByText(name)).toBeInTheDocument()
    }
    expect(within(dialog).getAllByText('Necessario')).toHaveLength(3)
  })

  it('asks a user to accept the current terms before using the app', async () => {
    let user = { ...USER, terms_current: false }
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'GET /api/auth/me': () => Response.json(user),
      'POST /api/auth/me/accept-terms': () => {
        user = { ...user, terms_current: true }
        return Response.json(user)
      },
      'GET /api/projects?archived=false': Response.json([]),
    })
    renderRoutes(routes, '/')

    expect(await screen.findByRole('heading', { name: "Termini d'uso e privacy" })).toBeVisible()
    const proceed = screen.getByRole('button', { name: 'Continua' })
    expect(proceed).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /Accetto i termini d'uso/ }))
    await userEvent.click(proceed)

    expect(await screen.findByRole('heading', { name: 'Progetti' })).toBeVisible()
    expect(calls.some((c) => c.path === '/api/auth/me/accept-terms')).toBe(true)
  })

  it('exports the data and deletes the account after confirming the email', async () => {
    const calls = mockApi({
      'GET /api/health': HEALTH_OK,
      'DELETE /api/auth/me': new Response(null, { status: 204 }),
    })
    renderRoutes(routes, '/profile')

    expect(await screen.findByRole('link', { name: 'Scarica i miei dati' })).toHaveAttribute(
      'href',
      '/api/auth/me/export',
    )
    await userEvent.click(screen.getByRole('button', { name: "Elimina l'account" }))
    const dialog = await screen.findByRole('dialog', { name: "Eliminare l'account?" })
    const confirm = within(dialog).getByRole('button', { name: 'Elimina definitivamente' })
    expect(confirm).toBeDisabled()
    await userEvent.type(within(dialog).getByRole('textbox'), 'consulente@example.com')
    await userEvent.click(confirm)

    expect(await screen.findByRole('heading', { name: 'Accedi' })).toBeVisible()
    expect(calls.find((c) => c.method === 'DELETE')?.body).toEqual({
      confirm_email: 'consulente@example.com',
    })
  })
})
