import { AppShell, Container, Group, Text, Title } from '@mantine/core'
import { Outlet } from 'react-router'

import { APP_NAME } from '../config'

export function Layout() {
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 40 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={3}>{APP_NAME}</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
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
