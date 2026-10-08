import { Anchor, Badge, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'

import {
  FACTOR_GROUP_LABEL,
  VERDICT_COLOR,
  VERDICT_LABEL,
  type Factor,
  type FactorGroup,
} from './goNoGo'

type Props = {
  matrix: Record<FactorGroup, Factor[]>
  linkTo: (path: string) => string
}

/** The nine AI Go/No-Go factors in three columns: business, data, execution. */
export function FactorMatrix({ matrix, linkTo }: Props) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" aria-label="Matrice dei fattori Go/No-Go">
      {(Object.keys(matrix) as FactorGroup[]).map((group) => (
        <Stack key={group} gap="xs">
          <Text size="sm" fw={600}>
            {FACTOR_GROUP_LABEL[group]}
          </Text>
          {matrix[group].map((factor) => (
            <Group key={factor.question.key} gap="xs" wrap="nowrap" align="flex-start">
              <Badge
                size="sm"
                variant={factor.verdict ? 'filled' : 'outline'}
                color={factor.verdict ? VERDICT_COLOR[factor.verdict] : 'gray'}
                style={{ flexShrink: 0 }}
                w={64}
              >
                {factor.verdict ? VERDICT_LABEL[factor.verdict] : '—'}
              </Badge>
              <Anchor component={Link} to={linkTo(factor.taskPath)} size="sm">
                {factor.question.prompt}
              </Anchor>
            </Group>
          ))}
        </Stack>
      ))}
    </SimpleGrid>
  )
}
