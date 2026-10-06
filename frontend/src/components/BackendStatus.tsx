import { Badge, Tooltip } from '@mantine/core'

import { useHealth } from '../api/health'

export function BackendStatus() {
  const { data, isPending, isError } = useHealth()

  if (isPending) {
    return (
      <Badge color="gray" variant="light">
        Verifica del backend…
      </Badge>
    )
  }
  if (isError) {
    return <Badge color="red">Backend non raggiungibile</Badge>
  }
  if (data.status === 'degraded') {
    return <Badge color="yellow">Backend online, database non raggiungibile</Badge>
  }
  return (
    <Tooltip label={`Versione ${data.version}`}>
      <Badge color="green" variant="light">
        Backend online
      </Badge>
    </Tooltip>
  )
}
