import { Group, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'

/**
 * The title row every page starts with: title, optional subtitle and actions on the right. On a
 * narrow screen the actions wrap below the title instead of squeezing it.
 */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Group justify="space-between" align="flex-start" gap="md">
      <Stack gap={4} style={{ flex: '1 1 320px', minWidth: 0 }}>
        <Group gap="sm" wrap="wrap">
          <Title order={1} style={{ overflowWrap: 'anywhere' }}>
            {title}
          </Title>
          {badge}
        </Group>
        {typeof subtitle === 'string' ? <Text c="dimmed">{subtitle}</Text> : subtitle}
      </Stack>
      {actions && (
        <Group gap="xs" wrap="wrap">
          {actions}
        </Group>
      )}
    </Group>
  )
}
