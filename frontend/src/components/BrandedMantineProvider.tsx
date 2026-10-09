import { MantineProvider } from '@mantine/core'
import { useMemo, type ReactNode } from 'react'

import { useMe } from '../api/auth'
import { buildTheme, DEFAULT_BRAND } from '../theme'

/** The Mantine theme, in the signed-in consultant's main colour. */
export function BrandedMantineProvider({ children }: { children: ReactNode }) {
  const me = useMe()
  const brand = me.data?.brand_color ?? DEFAULT_BRAND
  const theme = useMemo(() => buildTheme(brand), [brand])
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}
