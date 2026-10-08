import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiSend, type Schemas } from './client'

export type AdminUser = Schemas['AdminUserOut']
export type AdminAction = 'confirm-email' | 'suspend' | 'reactivate' | 'resend-verification'

const USERS_KEY = ['admin', 'users'] as const

export function useAdminUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => apiGet<AdminUser[]>('/api/admin/users'),
  })
}

export function useAdminAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, action }: { userId: number; action: AdminAction }) =>
      apiSend<AdminUser | undefined>('POST', `/api/admin/users/${userId}/${action}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}
