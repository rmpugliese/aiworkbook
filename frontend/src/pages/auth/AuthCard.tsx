import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconClipboardCheck } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import { APP_NAME } from '../../config'

/** The centred card shared by the sign-in, sign-up and password pages. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
}) {
  return (
    <Stack maw={440} mx="auto" my={48} gap="lg">
      <Stack gap={6} align="center" ta="center">
        <ThemeIcon size={44} radius="md">
          <IconClipboardCheck size={26} stroke={1.7} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {APP_NAME} · il workbook CPMAI per i tuoi progetti di AI
        </Text>
      </Stack>
      <Paper withBorder shadow="xs" p="xl">
        <Stack gap="md">
          <Stack gap={4}>
            <Title order={2}>{title}</Title>
            {subtitle && (
              <Text size="sm" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Stack>
          {children}
        </Stack>
      </Paper>
    </Stack>
  )
}
