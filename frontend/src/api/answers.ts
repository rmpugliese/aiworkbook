import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiSend, type Schemas } from './client'

export type Answer = Schemas['AnswerOut']
export type AnswerIn = Schemas['AnswerIn']
export type Verdict = NonNullable<Answer['verdict']>

const answersKey = (projectId: number, iterationId: number) =>
  ['projects', 'detail', projectId, 'iteration', iterationId, 'answers'] as const

const answersUrl = (projectId: number, iterationId: number) =>
  `/api/projects/${projectId}/iterations/${iterationId}/answers`

export function useAnswers(projectId: number, iterationId: number) {
  return useQuery({
    queryKey: answersKey(projectId, iterationId),
    queryFn: () => apiGet<Answer[]>(answersUrl(projectId, iterationId)),
    // Edits are written through the cache: never refetch underneath someone typing.
    staleTime: Infinity,
    select: (answers) => new Map(answers.map((answer) => [answer.question_key, answer])),
  })
}

/** Saves one answer and writes the result into the cached list, without refetching. */
export function useSaveAnswer(projectId: number, iterationId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: AnswerIn }) =>
      apiSend<Answer>(
        'PUT',
        `${answersUrl(projectId, iterationId)}/${encodeURIComponent(key)}`,
        data,
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData<Answer[]>(answersKey(projectId, iterationId), (current = []) => {
        const others = current.filter((answer) => answer.question_key !== saved.question_key)
        // A deleted (empty) answer comes back without a timestamp.
        return saved.updated_at === null ? others : [...others, saved]
      })
    },
  })
}
