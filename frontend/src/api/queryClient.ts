import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from './client'

const MAX_RETRIES = 3

/** Retries network and server errors only: a 4xx will not change by asking again. */
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

export const ME_KEY = ['me'] as const

export function createQueryClient(): QueryClient {
  // A 401 anywhere means the session is over: forget the user, and the router sends the
  // visitor to the sign-in page (see RequireAuth).
  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) {
      queryClient.setQueryData(ME_KEY, null)
    }
  }
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: { queries: { retry: shouldRetry } },
  })
  return queryClient
}
