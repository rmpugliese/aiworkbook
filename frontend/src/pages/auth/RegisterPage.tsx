import { Alert, Anchor, Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { MIN_PASSWORD_LENGTH, useRegister } from '../../api/auth'
import { AuthCard } from './AuthCard'

export function RegisterPage() {
  const register = useRegister()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH

  function submit(event: FormEvent) {
    event.preventDefault()
    register.mutate(
      { email, password, display_name: displayName.trim() || null },
      { onSuccess: () => navigate(`/check-email?email=${encodeURIComponent(email)}`) },
    )
  }

  return (
    <AuthCard title="Crea un account" subtitle="Ti invieremo un'email per confermare l'indirizzo.">
      <form onSubmit={submit}>
        <Stack>
          <TextInput
            label="Nome"
            description="Facoltativo: come vuoi comparire nell'app."
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.currentTarget.value)}
          />
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
            description={`Almeno ${MIN_PASSWORD_LENGTH} caratteri.`}
            autoComplete="new-password"
            required
            value={password}
            error={tooShort ? `Servono almeno ${MIN_PASSWORD_LENGTH} caratteri` : undefined}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          {register.error && <Alert color="red">{register.error.message}</Alert>}
          <Button
            type="submit"
            loading={register.isPending}
            disabled={password.length < MIN_PASSWORD_LENGTH}
          >
            Registrati
          </Button>
        </Stack>
      </form>
      <Text size="sm" ta="center">
        Hai già un account?{' '}
        <Anchor component={Link} to="/login">
          Accedi
        </Anchor>
      </Text>
    </AuthCard>
  )
}
