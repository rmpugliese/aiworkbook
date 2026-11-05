import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  FileButton,
  Group,
  Loader,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconArchive,
  IconBuilding,
  IconClock,
  IconFileImport,
  IconFolder,
  IconPlus,
  IconStack2,
} from '@tabler/icons-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import {
  useCreateProject,
  useImportProject,
  useProjects,
  type ProjectSummary,
} from '../api/projects'
import { PageHeader } from '../components/PageHeader'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { formatDate, iterationLabel } from '../format'

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Card component={Link} to={`/projects/${project.id}`} className="card-link">
      <Stack gap="sm" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon variant="light" size={38} radius="md">
              <IconFolder size={20} stroke={1.7} />
            </ThemeIcon>
            <div style={{ minWidth: 0 }}>
              <Text fw={600} lineClamp={2}>
                {project.name}
              </Text>
              <Group gap={4} c="dimmed" wrap="nowrap">
                <IconBuilding size={14} stroke={1.7} />
                <Text size="sm" truncate>
                  {project.client_name ?? 'Nessun cliente indicato'}
                </Text>
              </Group>
            </div>
          </Group>
          {project.archived_at && (
            <Badge color="gray" leftSection={<IconArchive size={12} />}>
              Archiviato
            </Badge>
          )}
        </Group>
        {project.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {project.description}
          </Text>
        )}
        <Divider mt="auto" />
        <Group gap="lg" c="dimmed">
          <Group gap={6}>
            <IconStack2 size={15} stroke={1.7} />
            <Text size="xs">{iterationLabel(project.iteration_count)}</Text>
          </Group>
          <Group gap={6}>
            <IconClock size={15} stroke={1.7} />
            <Text size="xs">Modificato il {formatDate(project.updated_at)}</Text>
          </Group>
        </Group>
      </Stack>
    </Card>
  )
}

function EmptyState({ archived, onCreate }: { archived: boolean; onCreate: () => void }) {
  return (
    <Card py={48}>
      <Stack align="center" gap="sm" ta="center">
        <ThemeIcon variant="light" size={56} radius="xl">
          {archived ? (
            <IconArchive size={28} stroke={1.5} />
          ) : (
            <IconFolder size={28} stroke={1.5} />
          )}
        </ThemeIcon>
        <Title order={3}>{archived ? 'Nessun progetto archiviato' : 'Nessun progetto'}</Title>
        <Text c="dimmed" maw={420}>
          {archived
            ? 'I progetti che archivi compaiono qui e si possono ripristinare in qualsiasi momento.'
            : 'Non hai ancora progetti. Crea il primo per iniziare a compilare il workbook.'}
        </Text>
        {!archived && (
          <Button mt="xs" leftSection={<IconPlus size={16} />} onClick={onCreate}>
            Crea il primo progetto
          </Button>
        )}
      </Stack>
    </Card>
  )
}

export function ProjectsPage() {
  const [view, setView] = useState<'active' | 'archived'>('active')
  const [creating, setCreating] = useState(false)
  const showArchived = view === 'archived'
  const projects = useProjects(showArchived)
  const createProject = useCreateProject()
  const importProject = useImportProject()
  const navigate = useNavigate()

  function startCreating() {
    createProject.reset()
    setCreating(true)
  }

  return (
    <Stack gap="lg" py="xl">
      <PageHeader
        title="Progetti"
        subtitle="I tuoi progetti di intelligenza artificiale, un workbook per ogni iterazione."
        actions={
          <>
            <FileButton
              accept="application/json,.json"
              onChange={(file) => {
                if (file) {
                  importProject.mutate(file, {
                    onSuccess: (project) => navigate(`/projects/${project.id}`),
                  })
                }
              }}
            >
              {(props) => (
                <Button
                  {...props}
                  variant="default"
                  leftSection={<IconFileImport size={16} />}
                  loading={importProject.isPending}
                >
                  Importa progetto
                </Button>
              )}
            </FileButton>
            <Button leftSection={<IconPlus size={16} />} onClick={startCreating}>
              Nuovo progetto
            </Button>
          </>
        }
      />

      {importProject.isError && (
        <Alert
          color="red"
          title="Importazione non riuscita"
          withCloseButton
          onClose={() => importProject.reset()}
        >
          {importProject.error.message}
        </Alert>
      )}

      <SegmentedControl
        w="fit-content"
        value={view}
        onChange={(value) => setView(value as 'active' | 'archived')}
        data={[
          { value: 'active', label: 'Attivi' },
          { value: 'archived', label: 'Archiviati' },
        ]}
        aria-label="Progetti da mostrare"
      />

      {projects.isPending && <Loader />}
      {projects.isError && (
        <Alert color="red" title="Impossibile caricare i progetti">
          {projects.error.message}
        </Alert>
      )}
      {projects.data?.length === 0 && (
        <EmptyState archived={showArchived} onCreate={startCreating} />
      )}
      {projects.data && projects.data.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
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
