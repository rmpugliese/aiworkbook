import {
  Accordion,
  Alert,
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Grid,
  Group,
  Loader,
  Progress,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { useAnswers, useSaveAnswer, type AnswerIn } from '../api/answers'
import { useIteration, useProject, useUpdateIteration, type Iteration } from '../api/projects'
import { useTemplate } from '../api/template'
import { formatDateTime } from '../format'
import { TaskView } from '../workbook/TaskView'
import { WorkbookNav } from '../workbook/WorkbookNav'
import { flattenTasks, phaseProgress } from '../workbook/structure'

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
        minRows={2}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      {update.isError && <Alert color="red">{update.error.message}</Alert>}
      <Group justify="flex-end">
        <Button
          size="xs"
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
  const [searchParams] = useSearchParams()

  const project = useProject(projectId)
  const iteration = useIteration(projectId, iterationId)
  const template = useTemplate(iteration.data?.template_version ?? 0)
  const answers = useAnswers(projectId, iterationId)
  const saveAnswer = useSaveAnswer(projectId, iterationId)
  const { mutateAsync } = saveAnswer
  const save = useCallback(
    (key: string, data: AnswerIn) => mutateAsync({ key, data }),
    [mutateAsync],
  )

  const queries = [project, iteration, template, answers]
  const failed = queries.find((query) => query.isError)
  if (failed) {
    return (
      <Alert color="red" my="xl" title="Iterazione non disponibile">
        {failed.error?.message}
      </Alert>
    )
  }
  if (!project.data || !iteration.data || !template.data || !answers.data) {
    return <Loader my="xl" />
  }

  const tasks = flattenTasks(template.data)
  const requested = tasks.findIndex((ref) => ref.path === searchParams.get('task'))
  const index = requested === -1 ? 0 : requested
  const current = tasks[index]
  const linkTo = (path: string) => `?task=${encodeURIComponent(path)}`

  const totals = template.data.phases.map((phase) => phaseProgress(phase, answers.data))
  const answered = totals.reduce((sum, p) => sum + p.answered, 0)
  const total = totals.reduce((sum, p) => sum + p.total, 0)

  return (
    <Stack gap="md" py="lg">
      <Breadcrumbs>
        <Anchor component={Link} to="/">
          Progetti
        </Anchor>
        <Anchor component={Link} to={`/projects/${projectId}`}>
          {project.data.name}
        </Anchor>
        <Text>{iteration.data.title}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-end">
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
        <Stack gap={4} w={220}>
          <Text size="sm" ta="right">
            {answered} di {total} domande compilate
          </Text>
          <Progress value={total ? (answered / total) * 100 : 0} aria-label="Avanzamento" />
        </Stack>
      </Group>

      <Accordion variant="contained" defaultValue={iteration.data.user_story ? null : 'story'}>
        <Accordion.Item value="story">
          <Accordion.Control>
            User story
            {iteration.data.user_story && (
              <Text size="sm" c="dimmed" lineClamp={1}>
                {iteration.data.user_story}
              </Text>
            )}
          </Accordion.Control>
          <Accordion.Panel>
            <UserStoryEditor
              key={iteration.data.updated_at}
              projectId={projectId}
              iteration={iteration.data}
            />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ScrollArea.Autosize mah="calc(100vh - 140px)" style={{ position: 'sticky', top: 76 }}>
            <WorkbookNav
              template={template.data}
              answers={answers.data}
              activePath={current.path}
              linkTo={linkTo}
            />
          </ScrollArea.Autosize>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <TaskView
            current={current}
            previous={tasks[index - 1]}
            next={tasks[index + 1]}
            answers={answers.data}
            save={save}
            linkTo={linkTo}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
