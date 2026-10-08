import { Alert, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useMe } from '../api/auth'

/** Renders its child routes for a signed-in user; otherwise sends the visitor to sign in. */
export function RequireAuth() {
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
  return <Outlet />
}
