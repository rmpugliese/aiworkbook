import type { RouteObject } from 'react-router'

import { Layout } from './components/Layout'
import { IterationPage } from './pages/IterationPage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectPage /> },
      { path: 'projects/:projectId/iterations/:iterationId', element: <IterationPage /> },
    ],
  },
]
