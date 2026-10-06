import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './client'

const MAX_RETRIES = 3

/** Retries network and server errors only: a 4xx will not change by asking again. */
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: shouldRetry } } })
}
