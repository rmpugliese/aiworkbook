import {
  Alert,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import {
  IconArchive,
  IconArchiveOff,
  IconBuilding,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconFileExport,
  IconPencil,
  IconUsers,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import {
  exportPdfUrl,
  exportProjectUrl,
  useCreateIteration,
  useDeleteProject,
  useProject,
  useSetArchived,
  useUpdateProject,
  type Project,
} from '../api/projects'
import { AIConsentCard } from '../components/AIConsentCard'
import { CollaboratorsCard } from '../components/CollaboratorsCard'
import { DeleteProjectModal } from '../components/DeleteProjectModal'
import { NewIterationModal } from '../components/NewIterationModal'
import { PageHeader } from '../components/PageHeader'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { formatDate, formatDateTime } from '../format'

const STATUS_LABEL = { draft: 'In corso', completed: 'Completata' } as const

type Dialog = 'edit' | 'iteration' | 'delete' | null

function ProjectDetail({ project }: { project: Project }) {
  const [dialog, setDialog] = useState<Dialog>(null)
  const navigate = useNavigate()
  const updateProject = useUpdateProject(project.id)
  const setArchived = useSetArchived(project.id)
  const deleteProject = useDeleteProject(project.id)
  const createIteration = useCreateIteration(project.id)
  const archived = project.archived_at !== null
  // Collaborators work on the workbook; the project itself is the owner's to manage.
  const owner = project.shared_by === null
  // Set by the workbook PDF import, to say what it found.
  const imported = (useLocation().state as { importedAnswers?: number } | null)?.importedAnswers
  const [showImported, setShowImported] = useState(imported !== undefined)

  function open(next: Dialog) {
    updateProject.reset()
    deleteProject.reset()
    createIteration.reset()
    setDialog(next)
  }
  const close = () => setDialog(null)

  return (
    <Stack gap="lg" py="xl">
      <Breadcrumbs separator={<IconChevronRight size={14} />}>
        <Anchor component={Link} to="/" size="sm">
          Progetti
        </Anchor>
        <Text size="sm" c="dimmed">
          {project.name}
        </Text>
      </Breadcrumbs>

      <PageHeader
        title={project.name}
        badge={
          <>
            {archived && (
              <Badge color="gray" leftSection={<IconArchive size={12} />}>
                Archiviato
              </Badge>
            )}
            {!owner && (
              <Badge variant="light" leftSection={<IconUsers size={12} />}>
                Condiviso da {project.shared_by}
              </Badge>
            )}
          </>
        }
        subtitle={
          <Group gap={6} c="dimmed" wrap="nowrap">
            <IconBuilding size={16} stroke={1.7} />
            <Text c="dimmed">{project.client_name ?? 'Nessun cliente indicato'}</Text>
          </Group>
        }
        actions={
          <>
            {owner && (
              <Button
                variant="default"
                leftSection={<IconPencil size={16} />}
                onClick={() => open('edit')}
              >
                Modifica
              </Button>
            )}
            <Button
              component="a"
              href={exportProjectUrl(project.id)}
              download
              variant="default"
              leftSection={<IconFileExport size={16} />}
            >
              Esporta
            </Button>
            {owner &&
              (archived ? (
                <>
                  <Button
                    variant="default"
                    leftSection={<IconArchiveOff size={16} />}
                    loading={setArchived.isPending}
                    onClick={() => setArchived.mutate(false)}
                  >
                    Ripristina
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => open('delete')}
                  >
                    Elimina definitivamente
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  leftSection={<IconArchive size={16} />}
                  loading={setArchived.isPending}
                  onClick={() => setArchived.mutate(true)}
                >
                  Archivia
                </Button>
              ))}
          </>
        }
      />

      {showImported && (
        <Alert
          color="green"
          icon={<IconCheck size={18} />}
          title={
            imported === 1
              ? 'Importata 1 risposta dal workbook PDF'
              : `Importate ${imported} risposte dal workbook PDF`
          }
          withCloseButton
          onClose={() => setShowImported(false)}
        >
          Le trovi nell'iterazione 1: rileggile e completa le domande rimaste vuote, comprese le
          decisioni di fine fase.
        </Alert>
      )}

      {setArchived.isError && <Alert color="red">{setArchived.error.message}</Alert>}

      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card>
            <Group justify="space-between" mb="md">
              <Title order={3}>Iterazioni</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={() => open('iteration')}>
                Nuova iterazione
              </Button>
            </Group>
            <Table.ScrollContainer minWidth={520}>
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={48}>N.</Table.Th>
                    <Table.Th>Titolo</Table.Th>
                    <Table.Th>Stato</Table.Th>
                    <Table.Th>Ultima modifica</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {project.iterations.map((iteration) => (
                    <Table.Tr key={iteration.id}>
                      <Table.Td c="dimmed">{iteration.number}</Table.Td>
                      <Table.Td>
                        <Anchor
                          component={Link}
                          to={`/projects/${project.id}/iterations/${iteration.id}`}
                          fw={500}
                        >
                          {iteration.title}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={iteration.status === 'completed' ? 'green' : 'brand'}>
                          {STATUS_LABEL[iteration.status]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDateTime(iteration.updated_at)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Anchor href={exportPdfUrl(project.id, iteration.id)} download size="sm">
                          <Group gap={4} wrap="nowrap">
                            <IconDownload size={14} />
                            PDF
                          </Group>
                        </Anchor>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Card>
              <Title order={4} mb="xs">
                Dettagli
              </Title>
              {project.description ? (
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {project.description}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  Nessuna descrizione.
                </Text>
              )}
              <Divider my="sm" />
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Creato il {formatDate(project.created_at)}
                </Text>
                <Text size="xs" c="dimmed">
                  Modificato il {formatDateTime(project.updated_at)}
                </Text>
              </Stack>
            </Card>
            <CollaboratorsCard projectId={project.id} />
            <AIConsentCard project={project} />
          </Stack>
        </Grid.Col>
      </Grid>

      {dialog === 'edit' && (
        <ProjectFormModal
          opened
          title="Modifica progetto"
          submitLabel="Salva"
          initial={{
            name: project.name,
            client_name: project.client_name ?? '',
            description: project.description ?? '',
          }}
          pending={updateProject.isPending}
          error={updateProject.error}
          onClose={close}
          onSubmit={(values) => updateProject.mutate(values, { onSuccess: close })}
        />
      )}
      {dialog === 'iteration' && (
        <NewIterationModal
          iterations={project.iterations}
          pending={createIteration.isPending}
          error={createIteration.error}
          onClose={close}
          onSubmit={(data) =>
            createIteration.mutate(data, {
              onSuccess: (iteration) =>
                navigate(`/projects/${project.id}/iterations/${iteration.id}`),
            })
          }
        />
      )}
      {dialog === 'delete' && (
        <DeleteProjectModal
          projectName={project.name}
          pending={deleteProject.isPending}
          error={deleteProject.error}
          onClose={close}
          onConfirm={(confirmName) =>
            deleteProject.mutate(confirmName, { onSuccess: () => navigate('/') })
          }
        />
      )}
    </Stack>
  )
}

export function ProjectPage() {
  const projectId = Number(useParams().projectId)
  const project = useProject(projectId)

  if (project.isPending) return <Loader my="xl" />
  if (project.isError) {
    return (
      <Alert color="red" my="xl" title="Progetto non disponibile">
        {project.error.message}
      </Alert>
    )
  }
  return <ProjectDetail project={project.data} />
}
