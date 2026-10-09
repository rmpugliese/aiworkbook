import { Alert, Badge, Button, Card, Group, Modal, Stack, Text, Title } from '@mantine/core'
import { useState } from 'react'

import { useAIStatus, useSetProjectAI } from '../api/ai'
import type { Project } from '../api/projects'

/** The owner's per-project consent to send its content to the assistant's endpoint. */
export function AIConsentCard({ project }: { project: Project }) {
  const status = useAIStatus()
  const setAI = useSetProjectAI(project.id)
  const [confirming, setConfirming] = useState(false)
  const enabled = project.ai_enabled_at !== null

  if (!status.data?.available) {
    return (
      <Card withBorder padding="lg">
        <Title order={4}>Assistente AI</Title>
        <Text size="sm" c="dimmed">
          L'assistente non è configurato: l'amministratore può collegarlo a un modello locale o
          remoto.
        </Text>
      </Card>
    )
  }
  const { model, host, location } = status.data

  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Group gap="xs">
            <Title order={4}>Assistente AI</Title>
            <Badge color={enabled ? 'green' : 'gray'}>{enabled ? 'Attivo' : 'Spento'}</Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Modello {model} su {host} ({location === 'locale' ? 'in locale' : 'servizio remoto'}).
          </Text>
        </Stack>
        {enabled ? (
          <Button variant="default" loading={setAI.isPending} onClick={() => setAI.mutate(false)}>
            Disattiva
          </Button>
        ) : (
          <Button onClick={() => setConfirming(true)}>Attiva l'assistente</Button>
        )}
      </Group>
      {setAI.isError && (
        <Alert color="red" mt="sm">
          {setAI.error.message}
        </Alert>
      )}

      <Modal
        opened={confirming}
        onClose={() => setConfirming(false)}
        title="Attivare l'assistente?"
      >
        <Stack>
          <Text size="sm">
            Quando chiedi aiuto all'assistente, la domanda, il testo del campo e le altre risposte
            di questa iterazione (con i dati del progetto e del cliente) vengono inviati al modello{' '}
            <b>{model}</b> su <b>{host}</b>.
          </Text>
          <Alert color={location === 'locale' ? 'green' : 'yellow'}>
            {location === 'locale'
              ? "L'endpoint è locale: i dati restano su questo computer o sulla rete locale."
              : "L'endpoint è un servizio remoto: verifica che il cliente acconsenta all'invio dei suoi dati a terzi."}
          </Alert>
          <Text size="sm" c="dimmed">
            Nulla viene inviato finché non usi l'assistente su un campo, e puoi disattivarlo in
            qualsiasi momento.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirming(false)}>
              Annulla
            </Button>
            <Button
              loading={setAI.isPending}
              onClick={() => setAI.mutate(true, { onSuccess: () => setConfirming(false) })}
            >
              Attiva
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  )
}
