import { Loader } from '@mantine/core'

import { useMe } from '../api/auth'
import { RequireAuth } from '../components/RequireAuth'
import { HomePage } from './HomePage'
import { ProjectsPage } from './ProjectsPage'

/** The address everyone starts from: the presentation for visitors, the projects for users. */
export function StartPage() {
  const me = useMe()
  if (me.isPending) return <Loader my="xl" />
  if (me.data === null) return <HomePage />
  return (
    <RequireAuth>
      <ProjectsPage />
    </RequireAuth>
  )
}
