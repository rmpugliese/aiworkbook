import {
  Alert,
  Anchor,
  Button,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'

import {
  GOOGLE_LOGIN_URL,
  useLogin,
  useMe,
  useProviders,
  useResendVerification,
} from '../../api/auth'
import { ApiError } from '../../api/client'
import { AuthCard } from './AuthCard'
import { safeNext } from './safeNext'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const navigate = useNavigate()
  const me = useMe()
  const providers = useProviders()
  const login = useLogin()
  const resend = useResendVerification()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (me.data) return <Navigate to={next} replace />

  const notVerified = login.error instanceof ApiError && login.error.status === 403

  function submit(event: FormEvent) {
    event.preventDefault()
    resend.reset()
    login.mutate({ email, password }, { onSuccess: () => navigate(next, { replace: true }) })
  }

  return (
    <AuthCard title="Accedi" subtitle="Entra per lavorare sui tuoi progetti.">
      {searchParams.get('error') === 'google' && (
        <Alert color="red">Accesso con Google non riuscito: riprova o usa email e password.</Alert>
      )}
      <form onSubmit={submit}>
        <Stack>
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Anchor component={Link} to="/forgot-password" size="sm">
              Password dimenticata?
            </Anchor>
          </Group>
          {login.error && (
            <Alert color={notVerified ? 'yellow' : 'red'}>
              {login.error.message}
              {notVerified && (
                <>
                  {' '}
                  {resend.isSuccess ? (
                    'Ti abbiamo inviato un nuovo link.'
                  ) : (
                    <Anchor component="button" type="button" onClick={() => resend.mutate(email)}>
                      Invia di nuovo il link di conferma
                    </Anchor>
                  )}
                </>
              )}
            </Alert>
          )}
          <Button type="submit" loading={login.isPending}>
            Accedi
          </Button>
        </Stack>
      </form>

      {providers.data?.google && (
        <>
          <Divider label="oppure" />
          <Button component="a" href={GOOGLE_LOGIN_URL} variant="default">
            Accedi con Google
          </Button>
        </>
      )}

      <Text size="sm" ta="center">
        Non hai un account?{' '}
        <Anchor component={Link} to="/register">
          Registrati
        </Anchor>
      </Text>
    </AuthCard>
  )
}
