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

/** A small two-phase template covering every question type. */
export const TEMPLATE = {
  version: 1,
  title: 'Workbook di prova',
  phases: [
    {
      key: 'business',
      number: 1,
      title: 'Comprensione del business',
      summary: 'Sintesi della fase.',
      task_groups: [
        {
          key: 'objectives',
          title: 'Obiettivi',
          summary: null,
          tasks: [
            {
              key: 'problem',
              title: 'Problema',
              guidance: 'Guida del task problema.',
              questions: [
                {
                  key: 'p1.objectives.problem.what',
                  type: 'text',
                  prompt: 'Quale problema risolvete?',
                  help: 'Aiuto sul problema.',
                },
              ],
            },
            {
              key: 'patterns',
              title: 'Pattern',
              guidance: 'Guida dei pattern.',
              questions: [
                {
                  key: 'p1.objectives.patterns.which',
                  type: 'multi_choice',
                  prompt: 'Quali pattern?',
                  help: 'Aiuto sui pattern.',
                  options: [
                    { key: 'predictive', label: 'Analisi predittiva' },
                    { key: 'recognition', label: 'Riconoscimento' },
                  ],
                },
              ],
            },
          ],
        },
        {
          key: 'gate',
          title: 'Go/No-Go della fase',
          summary: null,
          tasks: [
            {
              key: 'decision',
              title: 'Esito della Fase I',
              guidance: 'Guida esito.',
              questions: [
                {
                  key: 'p1.gate.decision.outcome',
                  type: 'phase_gate',
                  prompt: 'Si passa alla Fase II?',
                  help: 'Aiuto esito.',
                  criteria: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'data',
      number: 2,
      title: 'Comprensione dei dati',
      summary: 'Sintesi fase due.',
      task_groups: [
        {
          key: 'quality',
          title: 'Qualità',
          summary: null,
          tasks: [
            {
              key: 'verify',
              title: 'Verifica qualità',
              guidance: 'Guida qualità.',
              questions: [
                {
                  key: 'p2.quality.verify.factor',
                  type: 'go_no_go',
                  factor_group: 'data',
                  prompt: 'I dati sono di qualità?',
                  help: 'Aiuto qualità.',
                },
              ],
            },
          ],
        },
        {
          key: 'gate',
          title: 'Go/No-Go della fase',
          summary: null,
          tasks: [
            {
              key: 'decision',
              title: 'Passaggio alla Fase III',
              guidance: 'Guida passaggio.',
              questions: [
                {
                  key: 'p2.gate.decision.outcome',
                  type: 'phase_gate',
                  prompt: 'Si passa alla Fase III?',
                  help: 'Aiuto passaggio.',
                  criteria: [
                    { key: 'sources', label: 'Fonti individuate', return_to: 1 },
                    { key: 'quality', label: 'Qualità nota', return_to: null },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
