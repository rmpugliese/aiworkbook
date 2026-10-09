import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { createQueryClient } from './api/queryClient'
import { BrandedMantineProvider } from './components/BrandedMantineProvider'
import { routes } from './routes'

const router = createBrowserRouter(routes)

const queryClient = createQueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandedMantineProvider>
        <RouterProvider router={router} />
      </BrandedMantineProvider>
    </QueryClientProvider>
  )
}
