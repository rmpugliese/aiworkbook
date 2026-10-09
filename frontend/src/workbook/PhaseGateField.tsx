import { Alert, Checkbox, Select, Stack, Text } from '@mantine/core'

import type { Answer, Verdict } from '../api/answers'
import type { Template } from '../api/template'
import { QuestionCard, SaveIndicator, VerdictControl } from './AnswerControls'
import { useAnswerDraft, type SaveAnswer } from './useAnswerDraft'
import { AssistantPanel, type AssistantContext } from './AssistantPanel'
import { FactorMatrix } from './FactorMatrix'
import { MarkdownField } from './MarkdownField'
import {
  factorMatrix,
  gateSuggestion,
  phaseOneSuggestion,
  VERDICT_LABEL,
  type GateQuestion,
} from './goNoGo'
import { phaseLabel, ROMAN } from './structure'

type Props = {
  question: GateQuestion
  answers: Map<string, Answer>
  save: SaveAnswer
  template: Template
  linkTo: (path: string) => string
  assistant?: AssistantContext
}

type Suggestion =
  | { kind: 'incomplete'; message: string }
  | { kind: 'ready'; verdict: Verdict; returnTo: number | null; message: string }

/** End-of-phase Go/No-Go: the app suggests, the user decides and explains any difference. */
export function PhaseGateField({ question, answers, save, template, linkTo, assistant }: Props) {
  const { draft, update, status, retry } = useAnswerDraft(question, answers.get(question.key), save)
  const phaseNumber = Number(question.key.slice(1, 2))
  const isPhaseOne = phaseNumber === 1
  const matrix = isPhaseOne ? factorMatrix(template, answers) : null

  const suggestion: Suggestion = (() => {
    if (matrix) {
      const result = phaseOneSuggestion(Object.values(matrix).flat())
      return result.complete
        ? {
            kind: 'ready',
            verdict: result.verdict,
            returnTo: null,
            message: `Esito calcolato dai 9 fattori: ${VERDICT_LABEL[result.verdict]}.`,
          }
        : {
            kind: 'incomplete',
            message: `L'esito si calcola quando tutti i fattori hanno un verdetto (${result.answered} di ${result.total}).`,
          }
    }
    const result = gateSuggestion(question, draft.choices)
    const back = result.returnTo
      ? ` Tornare alla Fase ${ROMAN[result.returnTo - 1]}: ${result.reasons.map((c) => c.label.toLowerCase()).join('; ')}.`
      : ''
    const pending =
      result.verdict === 'maybe' ? ' Mancano criteri che si possono completare in questa fase.' : ''
    return {
      kind: 'ready',
      verdict: result.verdict,
      returnTo: result.returnTo,
      message: `Suggerimento: ${VERDICT_LABEL[result.verdict]}.${back}${pending}`,
    }
  })()

  const deviates =
    suggestion.kind === 'ready' &&
    draft.verdict !== null &&
    (draft.verdict !== suggestion.verdict ||
      (draft.verdict !== 'go' &&
        suggestion.returnTo !== null &&
        draft.returnToPhase !== suggestion.returnTo))
  const needsReason = deviates && !draft.text.trim()

  function chooseVerdict(verdict: Verdict) {
    if (verdict === 'go' || isPhaseOne) {
      update({ verdict, returnToPhase: null })
    } else {
      const returnTo =
        draft.returnToPhase ?? (suggestion.kind === 'ready' ? suggestion.returnTo : null)
      update({ verdict, returnToPhase: returnTo })
    }
  }

  const earlierPhases = template.phases.filter((phase) => phase.number < phaseNumber)

  return (
    <QuestionCard question={question}>
      {matrix && <FactorMatrix matrix={matrix} linkTo={linkTo} />}

      {!isPhaseOne && (
        <Checkbox.Group
          label="Criteri di passaggio"
          description="Spunta i criteri soddisfatti."
          value={draft.choices}
          onChange={(choices) => update({ choices })}
        >
          <Stack gap="xs" mt="xs">
            {question.criteria.map((criterion) => (
              <Checkbox
                key={criterion.key}
                value={criterion.key}
                label={criterion.label}
                description={
                  criterion.return_to
                    ? `Se manca, si torna alla Fase ${ROMAN[criterion.return_to - 1]}`
                    : 'Se manca, si completa in questa fase'
                }
              />
            ))}
          </Stack>
        </Checkbox.Group>
      )}

      <Alert
        variant="light"
        color={suggestion.kind === 'ready' ? 'blue' : 'gray'}
        title="Suggerimento dell'app"
      >
        {suggestion.message}
      </Alert>

      <Stack gap={4}>
        <Text size="sm" fw={500}>
          La tua decisione
        </Text>
        <VerdictControl
          value={draft.verdict}
          onChange={chooseVerdict}
          label={`Verdetto: ${question.prompt}`}
        />
      </Stack>

      {!isPhaseOne && draft.verdict !== null && draft.verdict !== 'go' && (
        <Select
          label="Fase a cui tornare"
          placeholder="Nessuna: si resta in questa fase"
          clearable
          data={earlierPhases.map((phase) => ({
            value: String(phase.number),
            label: phaseLabel(phase),
          }))}
          value={draft.returnToPhase === null ? null : String(draft.returnToPhase)}
          onChange={(value) => update({ returnToPhase: value === null ? null : Number(value) })}
        />
      )}

      {deviates && (
        <Alert
          variant="light"
          color={needsReason ? 'orange' : 'gray'}
          title="Scelta diversa dal suggerimento"
        >
          {needsReason
            ? 'La decisione è tua: spiega nella motivazione perché ti discosti dal suggerimento.'
            : 'Scostamento motivato.'}
        </Alert>
      )}

      <MarkdownField
        label="Motivazione"
        ariaLabel={`Note e motivazione: ${question.prompt}`}
        placeholder="Motivazione…"
        minRows={2}
        value={draft.text}
        error={needsReason ? 'Serve una motivazione per lo scostamento' : undefined}
        onChange={(text) => update({ text })}
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
