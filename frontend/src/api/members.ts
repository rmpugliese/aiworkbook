import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiSend, type Schemas } from './client'

export type Members = Schemas['MembersOut']
export type Member = Schemas['MemberOut']
export type InviteResult = Schemas['InviteResult']

const membersKey = (projectId: number) => ['projects', 'detail', projectId, 'members'] as const
const membersUrl = (projectId: number) => `/api/projects/${projectId}/members`

export function useMembers(projectId: number) {
  return useQuery({
    queryKey: membersKey(projectId),
    queryFn: () => apiGet<Members>(membersUrl(projectId)),
  })
}

export function useInviteMember(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => apiSend<InviteResult>('POST', membersUrl(projectId), { email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: membersKey(projectId) }),
  })
}

/** The owner removes a collaborator, or a collaborator leaves (removes themselves). */
export function useRemoveMember(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: number) =>
      apiSend<void>('DELETE', `${membersUrl(projectId)}/${memberId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}
