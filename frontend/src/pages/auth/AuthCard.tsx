import { Paper, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

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
    <Paper withBorder p="xl" maw={440} mx="auto" my="xl" radius="md">
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
  )
}
