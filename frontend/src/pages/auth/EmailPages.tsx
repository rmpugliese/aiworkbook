import { Alert, Anchor, Button, Loader, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import {
  MIN_PASSWORD_LENGTH,
  useRequestPasswordReset,
  useResendVerification,
  useResetPassword,
  useVerifyEmail,
} from '../../api/auth'
import { AuthCard } from './AuthCard'

export function CheckEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const resend = useResendVerification()

  return (
    <AuthCard title="Controlla la tua email">
      <Text>
        Se l'indirizzo è corretto, a breve riceverai un link per confermare l'account
        {email && (
          <>
            {' '}
            (<b>{email}</b>)
          </>
        )}
        . Il link vale 24 ore.
      </Text>
      {email &&
        (resend.isSuccess ? (
          <Alert color="green">Ti abbiamo inviato un nuovo link.</Alert>
        ) : (
          <Button variant="default" loading={resend.isPending} onClick={() => resend.mutate(email)}>
            Invia di nuovo il link
          </Button>
        ))}
      {resend.error && <Alert color="red">{resend.error.message}</Alert>}
      <Anchor component={Link} to="/login" size="sm">
        Torna all'accesso
      </Anchor>
    </AuthCard>
  )
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const verify = useVerifyEmail()
  const sent = useRef(false)

  useEffect(() => {
    // The link is single-use: send it once, even if the effect runs twice in development.
    if (sent.current || !token) return
    sent.current = true
    verify.mutate(token, { onSuccess: () => navigate('/', { replace: true }) })
  }, [token, verify, navigate])

  return (
    <AuthCard title="Conferma dell'email">
      {(verify.isPending || verify.isIdle) && token && <Loader />}
      {(verify.isError || !token) && (
        <>
          <Alert color="red">
            {verify.error?.message ?? 'Il link non è valido.'} Puoi chiederne uno nuovo dalla pagina
            di accesso.
          </Alert>
          <Anchor component={Link} to="/login">
            Vai all'accesso
          </Anchor>
        </>
      )}
    </AuthCard>
  )
}

export function ForgotPasswordPage() {
  const request = useRequestPasswordReset()
  const [email, setEmail] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    request.mutate(email)
  }

  return (
    <AuthCard
      title="Password dimenticata"
      subtitle="Ti invieremo un link per sceglierne una nuova."
    >
      {request.isSuccess ? (
        <Alert color="green">{request.data.detail}</Alert>
      ) : (
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
            {request.error && <Alert color="red">{request.error.message}</Alert>}
            <Button type="submit" loading={request.isPending}>
              Invia il link
            </Button>
          </Stack>
        </form>
      )}
      <Anchor component={Link} to="/login" size="sm">
        Torna all'accesso
      </Anchor>
    </AuthCard>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const reset = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && confirm !== password
  const valid = password.length >= MIN_PASSWORD_LENGTH && password === confirm

  function submit(event: FormEvent) {
    event.preventDefault()
    reset.mutate({ token, password })
  }

  if (reset.isSuccess) {
    return (
      <AuthCard title="Password aggiornata">
        <Text>La nuova password è attiva e le altre sessioni sono state chiuse.</Text>
        <Button component={Link} to="/login">
          Accedi
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Nuova password">
      <form onSubmit={submit}>
        <Stack>
          <PasswordInput
            label="Nuova password"
            description={`Almeno ${MIN_PASSWORD_LENGTH} caratteri.`}
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <PasswordInput
            label="Ripeti la password"
            autoComplete="new-password"
            required
            value={confirm}
            error={mismatch ? 'Le due password non coincidono' : undefined}
            onChange={(event) => setConfirm(event.currentTarget.value)}
          />
          {reset.error && <Alert color="red">{reset.error.message}</Alert>}
          <Button type="submit" loading={reset.isPending} disabled={!valid || !token}>
            Salva la nuova password
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
