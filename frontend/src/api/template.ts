import { useQuery } from '@tanstack/react-query'

import { apiGet, type Schemas } from './client'

export type Template = Schemas['Template']
export type Phase = Schemas['Phase']
export type TaskGroup = Schemas['TaskGroup']
export type Task = Schemas['Task']
export type Question = Task['questions'][number]
export type QuestionOfType<T extends Question['type']> = Extract<Question, { type: T }>

export function useTemplate(version: number) {
  return useQuery({
    queryKey: ['template', version],
    queryFn: () => apiGet<Template>(`/api/template/${version}`),
    // A template version never changes.
    staleTime: Infinity,
  })
}
