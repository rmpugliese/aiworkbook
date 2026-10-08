import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { ApiError, apiGet, apiSend, type Schemas } from './client'
import { ME_KEY } from './queryClient'

export type User = Schemas['UserOut']
type Message = Schemas['MessageOut']

/** The signed-in user, or null when nobody is signed in. */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async (): Promise<User | null> => {
      try {
        return await apiGet<User>('/api/auth/me')
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProviders() {
  return useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: () => apiGet<Schemas['ProvidersOut']>('/api/auth/providers'),
    staleTime: Infinity,
  })
}

/**
 * Switches the cache to another user (or to nobody): the previous user's data is dropped.
 * `clear()` would also detach components that stay mounted, like the header's user menu.
 */
function switchUser(queryClient: QueryClient, user: User | null) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_KEY[0] })
  queryClient.setQueryData(ME_KEY, user)
}

/** Signing in (or confirming the email, which signs in) starts a fresh cache for that user. */
function useSignIn<TVariables>(fn: (variables: TVariables) => Promise<User>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (user) => switchUser(queryClient, user),
  })
}

export function useLogin() {
  return useSignIn((data: { email: string; password: string }) =>
    apiSend<User>('POST', '/api/auth/login', data),
  )
}

export function useVerifyEmail() {
  return useSignIn((token: string) => apiSend<User>('POST', '/api/auth/verify-email', { token }))
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiSend<void>('POST', '/api/auth/logout'),
    onSettled: () => switchUser(queryClient, null),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; display_name: string | null }) =>
      apiSend<Message>('POST', '/api/auth/register', data),
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) =>
      apiSend<Message>('POST', '/api/auth/resend-verification', { email }),
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      apiSend<Message>('POST', '/api/auth/password-reset/request', { email }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      apiSend<void>('POST', '/api/auth/password-reset/confirm', data),
  })
}

export const GOOGLE_LOGIN_URL = '/api/auth/google/login'
export const MIN_PASSWORD_LENGTH = 10
