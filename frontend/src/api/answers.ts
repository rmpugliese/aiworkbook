import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, csrfToken, errorFrom, type Schemas } from './client'

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

/** A colleague saved this answer after the version the edit started from. */
export class AnswerConflictError extends Error {
  readonly current: Answer

  constructor(current: Answer) {
    super('Nel frattempo un collega ha modificato questa risposta.')
    this.current = current
  }
}

function storeAnswer(current: Answer[], saved: Answer): Answer[] {
  const others = current.filter((answer) => answer.question_key !== saved.question_key)
  // A deleted (empty) answer comes back without a timestamp.
  return saved.updated_at === null ? others : [...others, saved]
}

async function putAnswer(path: string, data: AnswerIn): Promise<Answer> {
  const response = await fetch(path, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': await csrfToken(),
    },
    body: JSON.stringify(data),
  })
  if (response.status === 409) {
    const body = (await response
      .clone()
      .json()
      .catch(() => null)) as { current?: Answer } | null
    if (body?.current) throw new AnswerConflictError(body.current)
  }
  if (!response.ok) throw await errorFrom(response, 'PUT', path)
  return (await response.json()) as Answer
}

/**
 * Saves one answer and writes the result into the cached list, without refetching. On a
 * conflict the colleague's version goes into the cache, so the page shows what is stored.
 */
export function useSaveAnswer(projectId: number, iterationId: number) {
  const queryClient = useQueryClient()
  const key = answersKey(projectId, iterationId)
  return useMutation({
    mutationFn: ({ key: questionKey, data }: { key: string; data: AnswerIn }) =>
      putAnswer(`${answersUrl(projectId, iterationId)}/${encodeURIComponent(questionKey)}`, data),
    onSuccess: (saved) => {
      queryClient.setQueryData<Answer[]>(key, (current = []) => storeAnswer(current, saved))
    },
    onError: (error) => {
      if (error instanceof AnswerConflictError) {
        queryClient.setQueryData<Answer[]>(key, (current = []) =>
          storeAnswer(current, error.current),
        )
      }
    },
  })
}
