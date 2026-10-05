import { useQuery } from '@tanstack/react-query'

import { apiGet, type Schemas } from './client'

export type Health = Schemas['HealthResponse']

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<Health>('/api/health'),
    retry: false,
  })
}
