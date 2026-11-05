import { Anchor, AppShell, Container, Group, Image, Text, ThemeIcon, Title } from '@mantine/core'
import { IconClipboardCheck } from '@tabler/icons-react'
import { Link, Outlet } from 'react-router'

import { useSite } from '../api/site'
import { APP_NAME } from '../config'
import { BackendStatus } from './BackendStatus'
import { CookiePanel } from './CookiePanel'
import { UserMenu } from './UserMenu'

/** The installation's logo when it has one, otherwise the app's mark and name. */
function Brand() {
  const site = useSite()
  const logo = site.data?.logo_url

  if (logo) {
    return (
      <Group gap="sm" wrap="nowrap">
        <Image src={logo} alt="Logo" h={34} w="auto" maw={180} fit="contain" />
        <Text size="sm" c="dimmed" visibleFrom="sm">
          {APP_NAME}
        </Text>
      </Group>
    )
  }
  return (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon size={32} radius="md" variant="filled">
        <IconClipboardCheck size={20} stroke={1.8} />
      </ThemeIcon>
      <Title order={3} fz={{ base: 'md', sm: 'lg' }}>
        {APP_NAME}
      </Title>
    </Group>
  )
}

export function Layout() {
  return (
    <AppShell header={{ height: 64 }} footer={{ height: 40 }} padding="md">
      <AppShell.Header withBorder>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Anchor component={Link} to="/" underline="never" c="inherit">
              <Brand />
            </Anchor>
            <Group gap="sm" wrap="nowrap">
              <BackendStatus />
              <UserMenu />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main bg="gray.0">
        <Container size="xl">
          <Outlet />
        </Container>
      </AppShell.Main>

      <AppShell.Footer bg="gray.0">
        <Group h="100%" px="md" justify="center" gap="md" wrap="nowrap">
          <Text size="xs" c="dimmed" visibleFrom="sm">
            Compatibile con la metodologia CPMAI
          </Text>
          <Anchor component={Link} to="/privacy" size="xs" c="dimmed">
            Privacy
          </Anchor>
          <Anchor component={Link} to="/terms" size="xs" c="dimmed">
            Termini
          </Anchor>
          <CookiePanel />
          <Anchor component={Link} to="/ai" size="xs" c="dimmed">
            Uso dell'AI
          </Anchor>
        </Group>
      </AppShell.Footer>
    </AppShell>
  )
}
