import { Alert, Badge, Button, Card, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'

import { useAdminAction, useAdminUsers, type AdminAction, type AdminUser } from '../api/admin'
import { useMe } from '../api/auth'
import { AISettingsCard } from '../components/AISettingsCard'
import { BrandCards } from '../components/BrandCards'
import { LegalCard } from '../components/LegalCard'
import { PageHeader } from '../components/PageHeader'
import { SignupStatsCard } from '../components/SignupStatsCard'
import { formatDate, formatDateTime } from '../format'

function Status({ user }: { user: AdminUser }) {
  if (user.suspended_at) return <Badge color="red">Sospeso</Badge>
  if (!user.email_verified_at) return <Badge color="yellow">Da confermare</Badge>
  return <Badge color="green">Attivo</Badge>
}

export function AdminUsersPage() {
  const me = useMe()
  const users = useAdminUsers()
  const action = useAdminAction()

  if (!me.data?.is_admin) {
    return (
      <Alert color="red" my="xl" title="Accesso negato">
        Questa pagina è riservata agli amministratori.
      </Alert>
    )
  }

  const run = (userId: number, kind: AdminAction) => action.mutate({ userId, action: kind })
  const busy = (userId: number, kind: AdminAction) =>
    action.isPending && action.variables?.userId === userId && action.variables.action === kind

  return (
    <Stack gap="lg" py="xl">
      <PageHeader
        title="Amministrazione"
        subtitle="Marchio, dati legali, assistente AI e account. Il contenuto dei progetti resta visibile solo ai loro proprietari e ai collaboratori che invitano."
      />

      {users.data && <SignupStatsCard users={users.data} />}
      <BrandCards />
      <LegalCard />
      <AISettingsCard />

      <Card>
        <Title order={3} mb="md">
          Utenti
        </Title>
        {action.isError && <Alert color="red">{action.error.message}</Alert>}
        {users.isPending && <Loader />}
        {users.isError && <Alert color="red">{users.error.message}</Alert>}

        {users.data && (
          <Table.ScrollContainer minWidth={640}>
            <Table highlightOnHover verticalSpacing="sm" aria-label="Utenti">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Utente</Table.Th>
                  <Table.Th>Stato</Table.Th>
                  <Table.Th>Iscritto il</Table.Th>
                  <Table.Th>Ultimo accesso</Table.Th>
                  <Table.Th>Progetti</Table.Th>
                  <Table.Th>Azioni</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.data.map((user) => {
                  const self = user.id === me.data?.id
                  return (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {user.display_name ?? user.email}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {user.email}
                          {user.google_linked && ' · Google'}
                          {user.is_admin && ' · amministratore'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Status user={user} />
                      </Table.Td>
                      <Table.Td>{formatDate(user.created_at)}</Table.Td>
                      <Table.Td>
                        {user.last_seen_at ? formatDateTime(user.last_seen_at) : '—'}
                      </Table.Td>
                      <Table.Td>{user.project_count}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {!user.email_verified_at && (
                            <>
                              <Button
                                size="compact-xs"
                                variant="light"
                                loading={busy(user.id, 'confirm-email')}
                                onClick={() => run(user.id, 'confirm-email')}
                              >
                                Conferma email
                              </Button>
                              <Button
                                size="compact-xs"
                                variant="default"
                                loading={busy(user.id, 'resend-verification')}
                                onClick={() => run(user.id, 'resend-verification')}
                              >
                                Reinvia link
                              </Button>
                            </>
                          )}
                          {user.suspended_at ? (
                            <Button
                              size="compact-xs"
                              variant="light"
                              loading={busy(user.id, 'reactivate')}
                              onClick={() => run(user.id, 'reactivate')}
                            >
                              Riattiva
                            </Button>
                          ) : (
                            !self && (
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="light"
                                loading={busy(user.id, 'suspend')}
                                onClick={() => run(user.id, 'suspend')}
                              >
                                Sospendi
                              </Button>
                            )
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </Stack>
  )
}
