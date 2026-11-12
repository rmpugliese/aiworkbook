import { Alert, Loader } from '@mantine/core'
import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useMe } from '../api/auth'
import { AcceptTermsPage } from '../pages/auth/AcceptTermsPage'

/**
 * Renders its children (or child routes) for a signed-in user; otherwise sends the visitor to sign
 * in, then back to the page they asked for.
 */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const me = useMe()
  const location = useLocation()

  if (me.isPending) return <Loader my="xl" />
  if (me.isError) {
    return (
      <Alert color="red" my="xl" title="Impossibile verificare l'accesso">
        {me.error.message}
      </Alert>
    )
  }
  if (!me.data) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (!me.data.terms_current) return <AcceptTermsPage />
  return children ?? <Outlet />
}
