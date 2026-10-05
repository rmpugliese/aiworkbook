import { Badge, Stack, Text, Title } from '@mantine/core'

import { useHealth } from '../api/health'

function BackendStatus() {
  const { data, isPending, isError } = useHealth()

  if (isPending) {
    return <Badge color="gray">Verifica del backend…</Badge>
  }
  if (isError) {
    return <Badge color="red">Backend non raggiungibile</Badge>
  }
  if (data.status === 'degraded') {
    return <Badge color="yellow">Backend online, database non raggiungibile</Badge>
  }
  return <Badge color="green">Backend online · v{data.version}</Badge>
}

export function Home() {
  return (
    <Stack gap="md" py="xl">
      <Title order={1}>Benvenuto</Title>
      <Text>
        Documenta i tuoi progetti di intelligenza artificiale fase per fase, iterazione per
        iterazione.
      </Text>
      <div>
        <BackendStatus />
      </div>
    </Stack>
  )
}
