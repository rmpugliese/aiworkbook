import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiPutFile, apiSend, type Schemas } from './client'

export type Site = Schemas['SiteOut']
export type LegalIn = Schemas['LegalIn']
export type DonationSettings = Schemas['DonationSettingsOut']

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
  return useSiteMutation((file: File) => apiPutFile<Site>('/api/admin/site/logo', file))
}

export function useDeleteSiteLogo() {
  return useSiteMutation(() => apiSend<Site>('DELETE', '/api/admin/site/logo'))
}

export function useUpdateLegal() {
  return useSiteMutation((data: LegalIn) => apiSend<Site>('PUT', '/api/admin/site/legal', data))
}

const DONATION_KEY = ['admin', 'donation'] as const

/** The invitation to donate as stored, shown or not: for administrators. */
export function useDonationSettings() {
  return useQuery({
    queryKey: DONATION_KEY,
    queryFn: () => apiGet<DonationSettings>('/api/admin/site/donation'),
  })
}

export function useUpdateDonation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DonationSettings) =>
      apiSend<DonationSettings>('PUT', '/api/admin/site/donation', data),
    onSuccess: (settings) => {
      queryClient.setQueryData(DONATION_KEY, settings)
      // The profile shows the invitation from the public site settings.
      void queryClient.invalidateQueries({ queryKey: SITE_KEY })
    },
  })
}
