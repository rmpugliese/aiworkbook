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
import { AiInfoPage } from './pages/legal/AiInfoPage'
import { CookiesPage } from './pages/legal/CookiesPage'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { TermsPage } from './pages/legal/TermsPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { StartPage } from './pages/StartPage'
import { IterationPage } from './pages/IterationPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProjectPage } from './pages/ProjectPage'

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
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'cookies', element: <CookiesPage /> },
      { path: 'ai', element: <AiInfoPage /> },
      { index: true, element: <StartPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'projects/:projectId', element: <ProjectPage /> },
          { path: 'projects/:projectId/iterations/:iterationId', element: <IterationPage /> },
          { path: 'admin', element: <AdminUsersPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
]
