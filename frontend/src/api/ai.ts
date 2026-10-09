import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'

import { apiGet, apiSend, csrfToken, errorFrom, type Schemas } from './client'
import type { Project } from './projects'

export type AIStatus = Schemas['AIStatusOut']
export type AISettings = Schemas['AISettingsOut']
export type AISettingsIn = Schemas['AISettingsIn']
export type AssistAction = Schemas['AssistIn']['action']

export function useAIStatus() {
  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => apiGet<AIStatus>('/api/ai/status'),
  })
}

export function useAISettings() {
  return useQuery({
    queryKey: ['ai', 'settings'],
    queryFn: () => apiGet<AISettings>('/api/admin/ai'),
  })
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AISettingsIn) => apiSend<AISettings>('PUT', '/api/admin/ai', data),
    onSuccess: (saved) => {
      queryClient.setQueryData(['ai', 'settings'], saved)
      void queryClient.invalidateQueries({ queryKey: ['ai', 'status'] })
    },
  })
}

export function useTestAI() {
  return useMutation({
    mutationFn: () => apiSend<Schemas['AITestOut']>('POST', '/api/admin/ai/test'),
  })
}

export function useSetProjectAI(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiSend<Project>('POST', `/api/projects/${projectId}/ai/${enabled ? 'enable' : 'disable'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export type AssistState =
  | { status: 'idle' }
  | { status: 'streaming'; action: AssistAction; text: string }
  | { status: 'done'; action: AssistAction; text: string }
  | { status: 'error'; action: AssistAction; text: string; message: string }

type AssistRequest = {
  questionKey: string
  action: AssistAction
  text: string
  verdict: 'go' | 'maybe' | 'no_go' | null
}

/** Reads the assistant's server-sent events: `delta` pieces, then `done` or `error`. */
export function useAssist(projectId: number, iterationId: number) {
  const [state, setState] = useState<AssistState>({ status: 'idle' })
  const controller = useRef<AbortController | null>(null)

  const run = useCallback(
    async ({ questionKey, action, text, verdict }: AssistRequest) => {
      controller.current?.abort()
      const abort = new AbortController()
      controller.current = abort
      let received = ''
      setState({ status: 'streaming', action, text: '' })
      const fail = (message: string) =>
        setState({ status: 'error', action, text: received, message })
      try {
        const path = `/api/projects/${projectId}/iterations/${iterationId}/assist`
        const response = await fetch(path, {
          method: 'POST',
          signal: abort.signal,
          headers: {
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
            'X-CSRF-Token': await csrfToken(),
          },
          body: JSON.stringify({ question_key: questionKey, action, text, verdict }),
        })
        if (!response.ok || !response.body) {
          fail((await errorFrom(response, 'POST', path)).message)
          return
        }
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const blocks = buffer.split('\n\n')
          buffer = blocks.pop() ?? ''
          for (const block of blocks) {
            const event = /^event: (.*)$/m.exec(block)?.[1]
            const data = JSON.parse(/^data: (.*)$/m.exec(block)?.[1] ?? '{}')
            if (event === 'delta') {
              received += data.text
              setState({ status: 'streaming', action, text: received })
            } else if (event === 'error') {
              fail(data.detail)
              return
            }
          }
        }
        setState({ status: 'done', action, text: received })
      } catch (error) {
        if (abort.signal.aborted) {
          setState(received ? { status: 'done', action, text: received } : { status: 'idle' })
        } else {
          fail(error instanceof Error ? error.message : 'Errore di rete.')
        }
      }
    },
    [projectId, iterationId],
  )

  const stop = useCallback(() => controller.current?.abort(), [])
  const reset = useCallback(() => {
    controller.current?.abort()
    setState({ status: 'idle' })
  }, [])

  return { state, run, stop, reset }
}
