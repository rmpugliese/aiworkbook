import { Badge } from '@mantine/core'

import { useHealth } from '../api/health'

/** Speaks up only when something is wrong: a healthy backend needs no badge. */
export function BackendStatus() {
  const { data, isError } = useHealth()

  if (isError) {
    return <Badge color="red">Backend non raggiungibile</Badge>
  }
  if (data?.status === 'degraded') {
    return <Badge color="yellow">Backend online, database non raggiungibile</Badge>
  }
  return null
}
