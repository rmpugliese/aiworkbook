import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiSend, type Schemas } from './client'

export type ShareLink = Schemas['ShareLinkOut']
export type ShareLinkCreated = Schemas['ShareLinkCreated']
export type ShareLinkIn = Schemas['ShareLinkIn']

function sharesPath(projectId: number, iterationId: number): string {
  return `/api/projects/${projectId}/iterations/${iterationId}/shares`
}

const sharesKey = (projectId: number, iterationId: number) =>
  ['shares', projectId, iterationId] as const

export function useShareLinks(projectId: number, iterationId: number) {
  return useQuery({
    queryKey: sharesKey(projectId, iterationId),
    queryFn: () => apiGet<ShareLink[]>(sharesPath(projectId, iterationId)),
  })
}

function useShareMutation<TVariables, TResult>(
  projectId: number,
  iterationId: number,
  fn: (path: string, variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variables: TVariables) => fn(sharesPath(projectId, iterationId), variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharesKey(projectId, iterationId) }),
  })
}

export function useCreateShareLink(projectId: number, iterationId: number) {
  return useShareMutation(projectId, iterationId, (path, data: ShareLinkIn) =>
    apiSend<ShareLinkCreated>('POST', path, data),
  )
}

export function useRevokeShareLink(projectId: number, iterationId: number) {
  return useShareMutation(projectId, iterationId, (path, linkId: number) =>
    apiSend<ShareLink>('POST', `${path}/${linkId}/revoke`),
  )
}

export function useDeleteShareLink(projectId: number, iterationId: number) {
  return useShareMutation(projectId, iterationId, (path, linkId: number) =>
    apiSend<void>('DELETE', `${path}/${linkId}`),
  )
}
