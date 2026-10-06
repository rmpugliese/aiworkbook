import { vi } from 'vitest'

type Handler = (body: unknown) => Response
export type Call = { method: string; path: string; body: unknown }

/**
 * Stubs `fetch` with handlers keyed by "METHOD /path?query". Unknown requests fail the test
 * loudly with a 501. Returns the recorded calls for assertions.
 */
export function mockApi(handlers: Record<string, Handler | Response>): Call[] {
  const calls: Call[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
      calls.push({ method, path: input, body })
      const handler = handlers[`${method} ${input}`]
      if (!handler) return new Response(`No mock for ${method} ${input}`, { status: 501 })
      return handler instanceof Response ? handler.clone() : handler(body)
    }),
  )
  return calls
}

export const HEALTH_OK = Response.json({ status: 'ok', version: '0.1.0', database: 'ok' })

const now = '2026-10-06T10:00:00Z'

export function iteration(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    project_id: 1,
    number: 1,
    title: 'Iterazione 1',
    user_story: null,
    template_version: 1,
    status: 'draft',
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

export function project(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Churn',
    client_name: 'ACME',
    description: null,
    created_at: now,
    updated_at: now,
    archived_at: null,
    iteration_count: 1,
    iterations: [iteration()],
    ...overrides,
  }
}
