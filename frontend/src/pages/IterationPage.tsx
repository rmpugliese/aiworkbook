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
  Paper,
  Progress,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconChevronRight, IconDownload, IconShare } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

import { useAIStatus } from '../api/ai'
import { useAnswers, useSaveAnswer, type AnswerIn } from '../api/answers'
import {
  exportPdfUrl,
  useIteration,
  useProject,
  useUpdateIteration,
  type Iteration,
} from '../api/projects'
import { useTemplate } from '../api/template'
import { ShareModal } from '../components/ShareModal'
import { formatDateTime } from '../format'
import { GoNoGoSummary } from '../workbook/GoNoGoSummary'
import { MarkdownField } from '../workbook/MarkdownField'
import { plainPreview } from '../workbook/markdownEditing'
import { TaskView } from '../workbook/TaskView'
import { WorkbookNav } from '../workbook/WorkbookNav'
import { flattenTasks, phaseProgress } from '../workbook/structure'

function UserStoryEditor({ projectId, iteration }: { projectId: number; iteration: Iteration }) {
  const [value, setValue] = useState(iteration.user_story ?? '')
  const update = useUpdateIteration(projectId, iteration.id)
  const dirty = value !== (iteration.user_story ?? '')

  return (
    <Stack gap="xs">
      <MarkdownField
        label="User story dell'iterazione"
        ariaLabel="User story dell'iterazione"
        description="Il riferimento di tutte le fasi del workbook per questa iterazione."
        minRows={2}
        value={value}
        onChange={setValue}
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
  const [sharing, setSharing] = useState(false)

  const project = useProject(projectId)
  const aiStatus = useAIStatus()
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

  const assistant =
    aiStatus.data?.available && project.data.ai_enabled_at ? { projectId, iterationId } : undefined
  const tasks = flattenTasks(template.data)
  const showSummary = searchParams.get('task') === 'summary'
  const requested = tasks.findIndex((ref) => ref.path === searchParams.get('task'))
  const index = requested === -1 ? 0 : requested
  const current = tasks[index]
  const linkTo = (path: string) => `?task=${encodeURIComponent(path)}`

  const totals = template.data.phases.map((phase) => phaseProgress(phase, answers.data))
  const answered = totals.reduce((sum, p) => sum + p.answered, 0)
  const total = totals.reduce((sum, p) => sum + p.total, 0)

  return (
    <Stack gap="md" py="lg">
      <Breadcrumbs separator={<IconChevronRight size={14} />}>
        <Anchor component={Link} to="/" size="sm">
          Progetti
        </Anchor>
        <Anchor component={Link} to={`/projects/${projectId}`} size="sm">
          {project.data.name}
        </Anchor>
        <Text size="sm" c="dimmed">
          {iteration.data.title}
        </Text>
      </Breadcrumbs>

      <Group justify="space-between" align="flex-end" gap="md">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="sm">
            <Title order={1}>
              {iteration.data.number}. {iteration.data.title}
            </Title>
            <Badge color="gray">Template v{iteration.data.template_version}</Badge>
            {iteration.data.ai_assisted_at && (
              <Tooltip
                label="I documenti di questa iterazione indicano che alcuni contenuti sono stati redatti con l'assistente AI."
                multiline
                w={280}
              >
                <Badge color="violet">Redatta con supporto AI</Badge>
              </Tooltip>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            Ultima modifica: {formatDateTime(iteration.data.updated_at)}
          </Text>
        </Stack>
        <Paper withBorder p="sm" w={{ base: '100%', xs: 300 }}>
          <Stack gap={8}>
            <Group justify="space-between" gap="xs">
              <Text size="sm" fw={500}>
                Avanzamento
              </Text>
              <Text size="sm" c="dimmed">
                {answered} di {total} domande compilate
              </Text>
            </Group>
            <Progress
              value={total ? (answered / total) * 100 : 0}
              aria-label="Avanzamento"
              size="sm"
              radius="xl"
            />
            <Group gap="xs" grow>
              <Button
                component="a"
                href={exportPdfUrl(projectId, iterationId)}
                variant="light"
                size="xs"
                leftSection={<IconDownload size={14} />}
                download
              >
                Scarica PDF
              </Button>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconShare size={14} />}
                onClick={() => setSharing(true)}
              >
                Condividi
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Group>

      {sharing && (
        <ShareModal
          projectId={projectId}
          iterationId={iterationId}
          archived={project.data.archived_at !== null}
          onClose={() => setSharing(false)}
        />
      )}

      <Accordion
        variant="contained"
        bg="white"
        radius="md"
        defaultValue={iteration.data.user_story ? null : 'story'}
      >
        <Accordion.Item value="story">
          <Accordion.Control>
            User story
            {iteration.data.user_story && (
              <Text size="sm" c="dimmed" lineClamp={1}>
                {plainPreview(iteration.data.user_story)}
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
          <Paper withBorder p={6} style={{ position: 'sticky', top: 80, overflow: 'hidden' }}>
            <ScrollArea.Autosize mah="calc(100vh - 150px)" type="auto" offsetScrollbars>
              <WorkbookNav
                template={template.data}
                answers={answers.data}
                activePath={showSummary ? 'summary' : current.path}
                linkTo={linkTo}
              />
            </ScrollArea.Autosize>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          {showSummary ? (
            <GoNoGoSummary template={template.data} answers={answers.data} linkTo={linkTo} />
          ) : (
            <TaskView
              current={current}
              previous={tasks[index - 1]}
              next={tasks[index + 1]}
              answers={answers.data}
              save={save}
              linkTo={linkTo}
              template={template.data}
              assistant={assistant}
            />
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
