import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

import type { Answer, AnswerIn } from '../api/answers'
import type { Template } from '../api/template'
import { QuestionField } from './QuestionField'
import { phaseLabel, type TaskRef } from './structure'

type Props = {
  current: TaskRef
  previous: TaskRef | undefined
  next: TaskRef | undefined
  answers: Map<string, Answer>
  save: (key: string, data: AnswerIn) => Promise<unknown>
  linkTo: (path: string) => string
  template: Template
}

export function TaskView({ current, previous, next, answers, save, linkTo, template }: Props) {
  const { phase, group, task } = current

  return (
    <Stack gap="md">
      <Stack gap={2}>
        <Text size="sm" c="dimmed">
          {phaseLabel(phase)} · {group.title}
        </Text>
        <Title order={2}>{task.title}</Title>
      </Stack>
      <Text style={{ whiteSpace: 'pre-wrap' }}>{task.guidance}</Text>

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
        />
      ))}

      <Group justify="space-between" mt="md">
        {previous ? (
          <Button component={Link} to={linkTo(previous.path)} variant="default">
            ← {previous.task.title}
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button component={Link} to={linkTo(next.path)}>
            {next.task.title} →
          </Button>
        )}
      </Group>
    </Stack>
  )
}
