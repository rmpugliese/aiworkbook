import { Box, Card, Group, Paper, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core'

import type { AdminUser } from '../api/admin'
import { CHART_DAYS, signupStats, type SignupDay } from '../stats'

const dayLabel = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })
const CHART_HEIGHT = 120

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fz={28} fw={700} lh={1.2}>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      )}
    </Paper>
  )
}

function signupsLabel(count: number): string {
  return count === 1 ? '1 iscrizione' : `${count} iscrizioni`
}

/** Sign-ups per day as bars scaled to the busiest day. */
function SignupChart({ days }: { days: SignupDay[] }) {
  const max = Math.max(1, ...days.map((day) => day.count))
  const total = days.reduce((sum, day) => sum + day.count, 0)

  return (
    <Stack gap={4}>
      <Box
        role="img"
        aria-label={`Iscrizioni negli ultimi ${CHART_DAYS} giorni: ${total} in totale, massimo ${max} in un giorno`}
        h={CHART_HEIGHT}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          borderBottom: '1px solid var(--mantine-color-gray-4)',
        }}
      >
        {days.map((day) => (
          <Tooltip
            key={day.date.toISOString()}
            label={`${dayLabel.format(day.date)}: ${signupsLabel(day.count)}`}
            withArrow
          >
            <Box
              style={{
                flex: 1,
                minWidth: 0,
                height: day.count ? `${(day.count / max) * 100}%` : 2,
                borderRadius: '3px 3px 0 0',
                background: day.count
                  ? 'var(--mantine-primary-color-filled)'
                  : 'var(--mantine-color-gray-3)',
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {dayLabel.format(days[0].date)}
        </Text>
        <Text size="xs" c="dimmed">
          oggi
        </Text>
      </Group>
    </Stack>
  )
}

/** How many people signed up, from the user list the page already has. */
export function SignupStatsCard({ users }: { users: AdminUser[] }) {
  const stats = signupStats(users)
  const pending = stats.total - stats.confirmed

  return (
    <Card>
      <Stack>
        <div>
          <Title order={3}>Statistiche</Title>
          <Text size="sm" c="dimmed">
            Iscrizioni all'app. Solo numeri: nessun dato dei progetti.
          </Text>
        </div>
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Stat label="Iscritti" value={stats.total} />
          <Stat
            label="Confermati"
            value={stats.confirmed}
            hint={pending ? `${pending} da confermare` : undefined}
          />
          <Stat label="Nuovi in 7 giorni" value={stats.last7Days} />
          <Stat label="Nuovi in 30 giorni" value={stats.last30Days} />
        </SimpleGrid>
        <div>
          <Text size="sm" fw={500} mb="xs">
            Iscrizioni negli ultimi {CHART_DAYS} giorni
          </Text>
          <SignupChart days={stats.days} />
        </div>
      </Stack>
    </Card>
  )
}
