import { Alert, Button, Checkbox, Stack, Text } from '@mantine/core'
import { useState } from 'react'

import { useAcceptTerms, useLogout } from '../../api/auth'
import { AuthCard } from './AuthCard'
import { TermsLabel } from './RegisterPage'

/**
 * Shown instead of the app to a signed-in user who has not accepted the current terms: a new
 * Google account, or anyone after the texts change.
 */
export function AcceptTermsPage() {
  const accept = useAcceptTerms()
  const logout = useLogout()
  const [accepted, setAccepted] = useState(false)

  return (
    <AuthCard
      title="Termini d'uso e privacy"
      subtitle="Prima di continuare, leggi e accetta i termini d'uso e l'informativa sulla privacy."
    >
      <Stack>
        <Text size="sm">
          Riassunto: i tuoi progetti restano tuoi e visibili solo a te e a chi condividi;
          l'assistente AI invia dati solo sui progetti in cui lo attivi; puoi scaricare i tuoi dati
          ed eliminare l'account quando vuoi.
        </Text>
        <Checkbox
          checked={accepted}
          onChange={(event) => setAccepted(event.currentTarget.checked)}
          label={<TermsLabel />}
        />
        {accept.isError && <Alert color="red">{accept.error.message}</Alert>}
        <Button disabled={!accepted} loading={accept.isPending} onClick={() => accept.mutate()}>
          Continua
        </Button>
        <Button variant="subtle" color="gray" onClick={() => logout.mutate()}>
          Esci
        </Button>
      </Stack>
    </AuthCard>
  )
}
