import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiSend, type Schemas } from './client'

export type ProjectSummary = Schemas['ProjectSummary']
export type Project = Schemas['ProjectOut']
export type Iteration = Schemas['IterationOut']
export type ProjectCreate = Schemas['ProjectCreate']
export type ProjectUpdate = Schemas['ProjectUpdate']
export type IterationCreate = Schemas['IterationCreate']
export type IterationUpdate = Schemas['IterationUpdate']

const keys = {
  all: ['projects'] as const,
  list: (archived: boolean) => ['projects', 'list', { archived }] as const,
  detail: (id: number) => ['projects', 'detail', id] as const,
  iteration: (projectId: number, iterationId: number) =>
    ['projects', 'detail', projectId, 'iteration', iterationId] as const,
}

export function useProjects(archived: boolean) {
  return useQuery({
    queryKey: keys.list(archived),
    queryFn: () => apiGet<ProjectSummary[]>(`/api/projects?archived=${archived}`),
  })
}

export function useProject(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => apiGet<Project>(`/api/projects/${id}`),
  })
}

export function useIteration(projectId: number, iterationId: number) {
  return useQuery({
    queryKey: keys.iteration(projectId, iterationId),
    queryFn: () => apiGet<Iteration>(`/api/projects/${projectId}/iterations/${iterationId}`),
  })
}

/** Every mutation refreshes all project data: lists, details and iterations stay consistent. */
function useProjectMutation<TVariables, TResult>(fn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  })
}

export function useCreateProject() {
  return useProjectMutation((data: ProjectCreate) =>
    apiSend<Project>('POST', '/api/projects', data),
  )
}

export function useUpdateProject(id: number) {
  return useProjectMutation((data: ProjectUpdate) =>
    apiSend<Project>('PATCH', `/api/projects/${id}`, data),
  )
}

export function useSetArchived(id: number) {
  return useProjectMutation((archived: boolean) =>
    apiSend<Project>('POST', `/api/projects/${id}/${archived ? 'archive' : 'unarchive'}`),
  )
}

export function useDeleteProject(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (confirmName: string) =>
      apiSend<void>('DELETE', `/api/projects/${id}`, { confirm_name: confirmName }),
    onSuccess: () => {
      // The project is gone: drop its cached detail instead of refetching a 404. The list
      // refresh is not awaited, so the caller's onSuccess (navigating away) runs right away.
      queryClient.removeQueries({ queryKey: keys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: ['projects', 'list'] })
    },
  })
}

export function useCreateIteration(projectId: number) {
  return useProjectMutation((data: IterationCreate) =>
    apiSend<Iteration>('POST', `/api/projects/${projectId}/iterations`, data),
  )
}

export function useUpdateIteration(projectId: number, iterationId: number) {
  return useProjectMutation((data: IterationUpdate) =>
    apiSend<Iteration>('PATCH', `/api/projects/${projectId}/iterations/${iterationId}`, data),
  )
}
