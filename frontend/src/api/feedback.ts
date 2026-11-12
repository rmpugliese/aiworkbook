import { useMutation } from '@tanstack/react-query'

import { apiSend, type Schemas } from './client'

export type FeedbackIn = Schemas['FeedbackIn']

/** A suggestion, emailed to the installation's contact address; nothing is stored. */
export function useSendFeedback() {
  return useMutation({
    mutationFn: (data: FeedbackIn) => apiSend<void>('POST', '/api/feedback', data),
  })
}
