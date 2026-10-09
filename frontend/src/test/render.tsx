import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'

import { createQueryClient } from '../api/queryClient'
import { BrandedMantineProvider } from '../components/BrandedMantineProvider'

/** Renders routes with the same providers and query settings as the real app, on a fresh cache. */
export function renderRoutes(routes: RouteObject[], initialPath = '/') {
  const queryClient = createQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrandedMantineProvider>
        <RouterProvider router={router} />
      </BrandedMantineProvider>
    </QueryClientProvider>,
  )
}
