import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  NumberInput,
  PasswordInput,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useState, type FormEvent } from 'react'

import { useAISettings, useTestAI, useUpdateAISettings, type AISettings } from '../api/ai'

const EXAMPLES =
  'Es. http://localhost:11434/v1 (Ollama), http://localhost:1234/v1 (LM Studio), https://openrouter.ai/api/v1'

function AISettingsForm({ saved }: { saved: AISettings }) {
  const update = useUpdateAISettings()
  const test = useTestAI()
  const [enabled, setEnabled] = useState(saved.enabled)
  const [baseUrl, setBaseUrl] = useState(saved.base_url)
  const [model, setModel] = useState(saved.model)
  const [apiKey, setApiKey] = useState('')
  const [temperature, setTemperature] = useState<number>(saved.temperature)
  const [maxTokens, setMaxTokens] = useState<number>(saved.max_tokens)

  function submit(event: FormEvent, clearKey = false) {
    event.preventDefault()
    test.reset()
    update.mutate(
      {
        enabled,
        base_url: baseUrl,
        model,
        temperature,
        max_tokens: maxTokens,
        api_key: apiKey.trim() || null,
        clear_api_key: clearKey,
      },
      { onSuccess: () => setApiKey('') },
    )
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        <Switch
          label="Assistente attivo"
          checked={enabled}
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        <TextInput
          label="URL dell'endpoint (compatibile OpenAI)"
          description={EXAMPLES}
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.currentTarget.value)}
        />
        <TextInput
          label="Modello"
          description="Il nome del modello come lo conosce l'endpoint, es. llama3.1:8b"
          value={model}
          onChange={(event) => setModel(event.currentTarget.value)}
        />
        <PasswordInput
          label="API key"
          description={
            saved.has_api_key
              ? `Impostata (…${saved.api_key_hint}). Lascia vuoto per non cambiarla.`
              : 'Facoltativa: i server locali di solito non la chiedono.'
          }
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.currentTarget.value)}
        />
        <Group grow>
          <NumberInput
            label="Temperatura"
            min={0}
            max={1}
            step={0.1}
            decimalScale={2}
            value={temperature}
            onChange={(value) => setTemperature(Number(value))}
          />
          <NumberInput
            label="Lunghezza massima (token)"
            min={50}
            max={8000}
            step={100}
            value={maxTokens}
            onChange={(value) => setMaxTokens(Number(value))}
          />
        </Group>
        {update.isError && <Alert color="red">{update.error.message}</Alert>}
        {update.isSuccess && <Alert color="green">Configurazione salvata.</Alert>}
        {test.data && (
          <Alert color={test.data.ok ? 'green' : 'red'}>
            {test.data.detail}
            {test.data.seconds != null && ` (${test.data.seconds} s)`}
          </Alert>
        )}
        {test.isError && <Alert color="red">{test.error.message}</Alert>}
        <Group justify="space-between">
          <Group gap="xs">
            <Button type="submit" loading={update.isPending}>
              Salva
            </Button>
            <Button variant="default" loading={test.isPending} onClick={() => test.mutate()}>
              Prova connessione
            </Button>
          </Group>
          {saved.has_api_key && (
            <Button variant="subtle" color="red" onClick={(event) => submit(event, true)}>
              Rimuovi la chiave
            </Button>
          )}
        </Group>
        <Text size="xs" c="dimmed">
          "Prova connessione" usa la configurazione salvata.
        </Text>
      </Stack>
    </form>
  )
}

export function AISettingsCard() {
  const settings = useAISettings()

  return (
    <Card>
      <Group justify="space-between" mb="md">
        <Title order={3}>Assistente AI</Title>
        {settings.data?.location && (
          <Badge color={settings.data.location === 'locale' ? 'green' : 'yellow'}>
            Endpoint {settings.data.location}
          </Badge>
        )}
      </Group>
      {settings.isPending && <Loader />}
      {settings.isError && <Alert color="red">{settings.error.message}</Alert>}
      {settings.data && <AISettingsForm saved={settings.data} />}
    </Card>
  )
}
