import type { RouteObject } from 'react-router'

import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import {
  CheckEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './pages/auth/EmailPages'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { IterationPage } from './pages/IterationPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'check-email', element: <CheckEmailPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <ProjectsPage /> },
          { path: 'projects/:projectId', element: <ProjectPage /> },
          { path: 'projects/:projectId/iterations/:iterationId', element: <IterationPage /> },
          { path: 'admin', element: <AdminUsersPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
]
