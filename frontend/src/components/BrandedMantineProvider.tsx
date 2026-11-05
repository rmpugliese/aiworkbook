import { MantineProvider } from '@mantine/core'
import { useMemo, type ReactNode } from 'react'

import { useSite } from '../api/site'
import { buildTheme, DEFAULT_BRAND } from '../theme'

/** The Mantine theme, in the installation's main colour. */
export function BrandedMantineProvider({ children }: { children: ReactNode }) {
  const site = useSite()
  const brand = site.data?.brand_color ?? DEFAULT_BRAND
  const theme = useMemo(() => buildTheme(brand), [brand])
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}
