import { Anchor, Badge, Group, Paper, Stack, Table, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

import type { Answer, Verdict } from '../api/answers'
import type { Template } from '../api/template'
import { FactorMatrix } from './FactorMatrix'
import { factorMatrix, gateOf, phaseOneSuggestion, VERDICT_COLOR, VERDICT_LABEL } from './goNoGo'
import { flattenTasks, phaseLabel, ROMAN } from './structure'

export function VerdictBadge({ verdict }: { verdict: Verdict | null }) {
  return verdict ? (
    <Badge color={VERDICT_COLOR[verdict]} style={{ flexShrink: 0 }}>
      {VERDICT_LABEL[verdict]}
    </Badge>
  ) : (
    <Badge color="gray" variant="outline" style={{ flexShrink: 0, overflow: 'visible' }}>
      Da valutare
    </Badge>
  )
}

type Props = {
  template: Template
  answers: Map<string, Answer>
  linkTo: (path: string) => string
}

export function GoNoGoSummary({ template, answers, linkTo }: Props) {
  const matrix = factorMatrix(template, answers)
  const suggestion = phaseOneSuggestion(Object.values(matrix).flat())
  const gatePaths = new Map(
    flattenTasks(template).flatMap((ref) =>
      ref.task.questions.filter((q) => q.type === 'phase_gate').map((q) => [q.key, ref.path]),
    ),
  )
  const phaseOneGate = gateOf(template.phases[0])
  const phaseOneChosen = phaseOneGate ? (answers.get(phaseOneGate.key)?.verdict ?? null) : null

  return (
    <Stack gap="lg">
      <Title order={2}>Riepilogo Go/No-Go</Title>

      <Paper withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>AI Go/No-Go della Fase I</Title>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Calcolato:
              </Text>
              {suggestion.complete ? (
                <VerdictBadge verdict={suggestion.verdict} />
              ) : (
                <Text size="sm">
                  da completare ({suggestion.answered} di {suggestion.total})
                </Text>
              )}
              <Text size="sm" c="dimmed">
                Deciso:
              </Text>
              <VerdictBadge verdict={phaseOneChosen} />
            </Group>
          </Group>
          <FactorMatrix matrix={matrix} linkTo={linkTo} />
        </Stack>
      </Paper>

      <Table aria-label="Esito delle fasi">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fase</Table.Th>
            <Table.Th w={130}>Esito</Table.Th>
            <Table.Th>Fase di ritorno</Table.Th>
            <Table.Th>Motivazione</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {template.phases.map((phase) => {
            const gate = gateOf(phase)
            const answer = gate ? answers.get(gate.key) : undefined
            const path = gate ? gatePaths.get(gate.key) : undefined
            return (
              <Table.Tr key={phase.key}>
                <Table.Td>
                  {path ? (
                    <Anchor component={Link} to={linkTo(path)}>
                      {phaseLabel(phase)}
                    </Anchor>
                  ) : (
                    phaseLabel(phase)
                  )}
                </Table.Td>
                <Table.Td>
                  <VerdictBadge verdict={answer?.verdict ?? null} />
                </Table.Td>
                <Table.Td>
                  {answer?.return_to_phase ? `Fase ${ROMAN[answer.return_to_phase - 1]}` : '—'}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={2}>
                    {answer?.text ?? '—'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
