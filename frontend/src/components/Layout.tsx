import { Anchor, AppShell, Container, Group, Text, Title } from '@mantine/core'
import { Link, Outlet } from 'react-router'

import { APP_NAME } from '../config'
import { BackendStatus } from './BackendStatus'

export function Layout() {
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 40 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Anchor component={Link} to="/" underline="never" c="inherit">
            <Title order={3}>{APP_NAME}</Title>
          </Anchor>
          <BackendStatus />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Outlet />
        </Container>
      </AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" px="md" justify="center">
          <Text size="xs" c="dimmed">
            Compatibile con la metodologia CPMAI
          </Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  )
}
