import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useCreateProject, useProjects, type ProjectSummary } from '../api/projects'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { formatDateTime, iterationLabel } from '../format'

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Card component={Link} to={`/projects/${project.id}`} withBorder padding="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text fw={600}>{project.name}</Text>
        {project.archived_at && <Badge color="gray">Archiviato</Badge>}
      </Group>
      <Text size="sm" c="dimmed">
        {project.client_name ?? 'Nessun cliente indicato'}
      </Text>
      <Text size="sm" mt="sm">
        {iterationLabel(project.iteration_count)} · modificato il{' '}
        {formatDateTime(project.updated_at)}
      </Text>
    </Card>
  )
}

export function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [creating, setCreating] = useState(false)
  const projects = useProjects(showArchived)
  const createProject = useCreateProject()
  const navigate = useNavigate()

  return (
    <Stack gap="lg" py="xl">
      <Group justify="space-between">
        <Title order={1}>Progetti</Title>
        <Button
          onClick={() => {
            createProject.reset()
            setCreating(true)
          }}
        >
          Nuovo progetto
        </Button>
      </Group>

      <Switch
        label="Mostra archiviati"
        checked={showArchived}
        onChange={(event) => setShowArchived(event.currentTarget.checked)}
      />

      {projects.isPending && <Loader />}
      {projects.isError && (
        <Alert color="red" title="Impossibile caricare i progetti">
          {projects.error.message}
        </Alert>
      )}
      {projects.data?.length === 0 && (
        <Text c="dimmed">
          {showArchived
            ? 'Nessun progetto archiviato.'
            : 'Non hai ancora progetti. Crea il primo per iniziare a compilare il workbook.'}
        </Text>
      )}
      {projects.data && projects.data.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {projects.data.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </SimpleGrid>
      )}

      {creating && (
        <ProjectFormModal
          opened
          title="Nuovo progetto"
          submitLabel="Crea progetto"
          pending={createProject.isPending}
          error={createProject.error}
          onClose={() => setCreating(false)}
          onSubmit={(values) =>
            createProject.mutate(values, {
              onSuccess: (project) => navigate(`/projects/${project.id}`),
            })
          }
        />
      )}
    </Stack>
  )
}
