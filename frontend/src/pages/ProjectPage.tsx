import {
  Alert,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import {
  exportPdfUrl,
  useCreateIteration,
  useDeleteProject,
  useProject,
  useSetArchived,
  useUpdateProject,
  type Project,
} from '../api/projects'
import { AIConsentCard } from '../components/AIConsentCard'
import { DeleteProjectModal } from '../components/DeleteProjectModal'
import { NewIterationModal } from '../components/NewIterationModal'
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

  function open(next: Dialog) {
    updateProject.reset()
    deleteProject.reset()
    createIteration.reset()
    setDialog(next)
  }
  const close = () => setDialog(null)

  return (
    <Stack gap="lg" py="xl">
      <Breadcrumbs>
        <Anchor component={Link} to="/">
          Progetti
        </Anchor>
        <Text>{project.name}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Group gap="sm">
            <Title order={1}>{project.name}</Title>
            {archived && <Badge color="gray">Archiviato</Badge>}
          </Group>
          <Text c="dimmed">{project.client_name ?? 'Nessun cliente indicato'}</Text>
        </Stack>
        <Group>
          <Button variant="default" onClick={() => open('edit')}>
            Modifica
          </Button>
          {archived ? (
            <>
              <Button
                variant="default"
                loading={setArchived.isPending}
                onClick={() => setArchived.mutate(false)}
              >
                Ripristina
              </Button>
              <Button color="red" variant="light" onClick={() => open('delete')}>
                Elimina definitivamente
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              loading={setArchived.isPending}
              onClick={() => setArchived.mutate(true)}
            >
              Archivia
            </Button>
          )}
        </Group>
      </Group>

      {setArchived.isError && <Alert color="red">{setArchived.error.message}</Alert>}

      {project.description && <Text style={{ whiteSpace: 'pre-wrap' }}>{project.description}</Text>}
      <Text size="sm" c="dimmed">
        Creato il {formatDate(project.created_at)} · modificato il{' '}
        {formatDateTime(project.updated_at)}
      </Text>

      <AIConsentCard project={project} />

      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Title order={3}>Iterazioni</Title>
          <Button onClick={() => open('iteration')}>Nuova iterazione</Button>
        </Group>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>N.</Table.Th>
              <Table.Th>Titolo</Table.Th>
              <Table.Th>Stato</Table.Th>
              <Table.Th>Ultima modifica</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {project.iterations.map((iteration) => (
              <Table.Tr key={iteration.id}>
                <Table.Td>{iteration.number}</Table.Td>
                <Table.Td>
                  <Anchor
                    component={Link}
                    to={`/projects/${project.id}/iterations/${iteration.id}`}
                  >
                    {iteration.title}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={iteration.status === 'completed' ? 'green' : 'blue'}
                  >
                    {STATUS_LABEL[iteration.status]}
                  </Badge>
                </Table.Td>
                <Table.Td>{formatDateTime(iteration.updated_at)}</Table.Td>
                <Table.Td>
                  <Anchor href={exportPdfUrl(project.id, iteration.id)} download size="sm">
                    PDF
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

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
