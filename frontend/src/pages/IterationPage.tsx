import {
  Alert,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { useIteration, useProject, useUpdateIteration, type Iteration } from '../api/projects'
import { formatDateTime } from '../format'

function UserStoryEditor({ projectId, iteration }: { projectId: number; iteration: Iteration }) {
  const [value, setValue] = useState(iteration.user_story ?? '')
  const update = useUpdateIteration(projectId, iteration.id)
  const dirty = value !== (iteration.user_story ?? '')

  return (
    <Stack gap="xs">
      <Textarea
        label="User story dell'iterazione"
        description="Il riferimento di tutte le fasi del workbook per questa iterazione."
        autosize
        minRows={3}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      {update.isError && <Alert color="red">{update.error.message}</Alert>}
      <Group justify="flex-end">
        <Button
          disabled={!dirty}
          loading={update.isPending}
          onClick={() => update.mutate({ user_story: value })}
        >
          Salva user story
        </Button>
      </Group>
    </Stack>
  )
}

export function IterationPage() {
  const params = useParams()
  const projectId = Number(params.projectId)
  const iterationId = Number(params.iterationId)
  const project = useProject(projectId)
  const iteration = useIteration(projectId, iterationId)

  if (project.isPending || iteration.isPending) return <Loader my="xl" />
  if (project.isError || iteration.isError) {
    return (
      <Alert color="red" my="xl" title="Iterazione non disponibile">
        {(project.error ?? iteration.error)?.message}
      </Alert>
    )
  }

  return (
    <Stack gap="lg" py="xl">
      <Breadcrumbs>
        <Anchor component={Link} to="/">
          Progetti
        </Anchor>
        <Anchor component={Link} to={`/projects/${projectId}`}>
          {project.data.name}
        </Anchor>
        <Text>{iteration.data.title}</Text>
      </Breadcrumbs>

      <Stack gap={4}>
        <Group gap="sm">
          <Title order={1}>
            {iteration.data.number}. {iteration.data.title}
          </Title>
          <Badge variant="light">Template v{iteration.data.template_version}</Badge>
        </Group>
        <Text size="sm" c="dimmed">
          Ultima modifica: {formatDateTime(iteration.data.updated_at)}
        </Text>
      </Stack>

      <UserStoryEditor
        key={iteration.data.updated_at}
        projectId={projectId}
        iteration={iteration.data}
      />

      <Alert color="blue" title="Compilazione in arrivo">
        La compilazione del workbook fase per fase arriverà nella prossima fase di sviluppo.
      </Alert>
    </Stack>
  )
}
