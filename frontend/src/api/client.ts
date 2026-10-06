import type { components } from './schema'

export type Schemas = components['schemas']

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function errorFrom(response: Response, method: string, path: string): Promise<ApiError> {
  let message = `${method} ${path} failed with ${response.status}`
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
      message = body.detail
    }
  } catch {
    // Not a JSON body: keep the generic message.
  }
  return new ApiError(response.status, message)
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw await errorFrom(response, 'GET', path)
  }
  return (await response.json()) as T
}

/** Sends a JSON request; resolves to undefined for 204 No Content. */
export async function apiSend<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw await errorFrom(response, method, path)
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}
