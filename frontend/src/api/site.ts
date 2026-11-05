import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiSend, csrfToken, errorFrom, type Schemas } from './client'

export type Site = Schemas['SiteOut']
export type LegalIn = Schemas['LegalIn']

const SITE_KEY = ['site'] as const

/** The installation's brand, legal details and AI notice: public, the same for everyone. */
export function useSite() {
  return useQuery({
    queryKey: SITE_KEY,
    queryFn: () => apiGet<Site>('/api/site'),
    staleTime: 5 * 60 * 1000,
  })
}

/** Admin changes return the updated site, which replaces the cached one (and the theme). */
function useSiteMutation<TVariables>(fn: (variables: TVariables) => Promise<Site>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (site) => queryClient.setQueryData(SITE_KEY, site),
  })
}

export function useUpdateBrandColor() {
  return useSiteMutation((brandColor: string | null) =>
    apiSend<Site>('PUT', '/api/admin/site/brand', { brand_color: brandColor ?? '' }),
  )
}

export function useUploadSiteLogo() {
  return useSiteMutation(async (file: File) => {
    const body = new FormData()
    body.append('file', file)
    const path = '/api/admin/site/logo'
    // No Content-Type: the browser sets the multipart boundary itself.
    const response = await fetch(path, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'X-CSRF-Token': await csrfToken() },
      body,
    })
    if (!response.ok) throw await errorFrom(response, 'PUT', path)
    return (await response.json()) as Site
  })
}

export function useDeleteSiteLogo() {
  return useSiteMutation(() => apiSend<Site>('DELETE', '/api/admin/site/logo'))
}

export function useUpdateLegal() {
  return useSiteMutation((data: LegalIn) => apiSend<Site>('PUT', '/api/admin/site/legal', data))
}
