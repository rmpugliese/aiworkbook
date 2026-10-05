import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { Layout } from './components/Layout'
import { Home } from './pages/Home'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [{ index: true, element: <Home /> }],
  },
])

const queryClient = new QueryClient()

export default function App() {
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  )
}
