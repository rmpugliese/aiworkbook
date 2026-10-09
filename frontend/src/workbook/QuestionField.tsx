import { Checkbox, Stack, Textarea } from '@mantine/core'

import type { Answer } from '../api/answers'
import type { Question, Template } from '../api/template'
import { QuestionCard, SaveIndicator, VerdictControl } from './AnswerControls'
import { useAnswerDraft, type SaveAnswer } from './useAnswerDraft'
import { AssistantPanel, type AssistantContext } from './AssistantPanel'
import { PhaseGateField } from './PhaseGateField'

type Props = {
  question: Question
  answers: Map<string, Answer>
  save: SaveAnswer
  template: Template
  linkTo: (path: string) => string
  /** Set when the assistant is available and enabled for this project. */
  assistant?: AssistantContext
}

/** One workbook question, saved automatically. Remount to reset its draft. */
export function QuestionField({ question, answers, save, template, linkTo, assistant }: Props) {
  if (question.type === 'phase_gate') {
    return (
      <PhaseGateField
        question={question}
        answers={answers}
        save={save}
        template={template}
        linkTo={linkTo}
        assistant={assistant}
      />
    )
  }
  return (
    <BasicQuestionField
      question={question}
      answer={answers.get(question.key)}
      save={save}
      assistant={assistant}
    />
  )
}

type BasicQuestion = Exclude<Question, { type: 'phase_gate' }>

function BasicQuestionField({
  question,
  answer,
  save,
  assistant,
}: {
  question: BasicQuestion
  answer: Answer | undefined
  save: SaveAnswer
  assistant?: AssistantContext
}) {
  const { draft, update, status, retry } = useAnswerDraft(question, answer, save)

  return (
    <QuestionCard question={question}>
      {question.type === 'multi_choice' && (
        <Checkbox.Group
          value={draft.choices}
          onChange={(choices) => update({ choices })}
          aria-label={question.prompt}
        >
          <Stack gap="xs">
            {question.options.map((option) => (
              <Checkbox key={option.key} value={option.key} label={option.label} />
            ))}
          </Stack>
        </Checkbox.Group>
      )}

      {question.type === 'go_no_go' && (
        <VerdictControl
          value={draft.verdict}
          onChange={(verdict) => update({ verdict })}
          label={`Verdetto: ${question.prompt}`}
        />
      )}

      <Textarea
        aria-label={
          question.type === 'text' ? question.prompt : `Note e motivazione: ${question.prompt}`
        }
        placeholder={
          question.type === 'text'
            ? 'Scrivi la risposta…'
            : question.type === 'multi_choice'
              ? 'Note (facoltative)…'
              : 'Motivazione…'
        }
        autosize
        minRows={question.type === 'text' ? 4 : 2}
        value={draft.text}
        onChange={(event) => update({ text: event.currentTarget.value })}
      />
      {assistant && (
        <AssistantPanel
          assistant={assistant}
          questionKey={question.key}
          text={draft.text}
          verdict={draft.verdict}
          onApply={(text) => update({ text })}
        />
      )}
      <SaveIndicator status={status} onRetry={retry} />
    </QuestionCard>
  )
}
