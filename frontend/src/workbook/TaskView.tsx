import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { Link } from 'react-router'

import type { Answer } from '../api/answers'
import type { Template } from '../api/template'
import type { AssistantContext } from './AssistantPanel'
import { QuestionField } from './QuestionField'
import { phaseLabel, type TaskRef } from './structure'
import type { SaveAnswer } from './useAnswerDraft'

type Props = {
  current: TaskRef
  previous: TaskRef | undefined
  next: TaskRef | undefined
  answers: Map<string, Answer>
  save: SaveAnswer
  linkTo: (path: string) => string
  template: Template
  assistant?: AssistantContext
}

export function TaskView({
  current,
  previous,
  next,
  answers,
  save,
  linkTo,
  template,
  assistant,
}: Props) {
  const { phase, group, task } = current

  return (
    <Stack gap="md">
      <Stack gap={2}>
        <Text size="xs" c="brand" fw={600} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
          {phaseLabel(phase)} · {group.title}
        </Text>
        <Title order={2}>{task.title}</Title>
      </Stack>
      <Text c="dark.4" style={{ whiteSpace: 'pre-wrap' }}>
        {task.guidance}
      </Text>

      {task.questions.length === 0 && (
        <Text c="dimmed" fs="italic">
          Questo task non ha domande da compilare.
        </Text>
      )}
      {task.questions.map((question) => (
        // Keyed by task too, so moving to another task always starts from the stored answer.
        <QuestionField
          key={`${current.path}/${question.key}`}
          question={question}
          answers={answers}
          save={save}
          template={template}
          linkTo={linkTo}
          assistant={assistant}
        />
      ))}

      <Group justify="space-between" mt="md">
        {previous ? (
          <Button
            component={Link}
            to={linkTo(previous.path)}
            aria-label={`Task precedente: ${previous.task.title}`}
            variant="default"
            leftSection={<IconArrowLeft size={16} />}
          >
            {previous.task.title}
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button
            component={Link}
            to={linkTo(next.path)}
            aria-label={`Task successivo: ${next.task.title}`}
            rightSection={<IconArrowRight size={16} />}
          >
            {next.task.title}
          </Button>
        )}
      </Group>
    </Stack>
  )
}
