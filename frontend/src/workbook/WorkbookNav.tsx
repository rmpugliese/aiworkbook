import { Badge, Group, NavLink, Stack, Text } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

import type { Answer } from '../api/answers'
import type { Template } from '../api/template'
import { VERDICT_COLOR, VERDICT_LABEL, phaseStatus } from './goNoGo'
import { phaseLabel, phaseProgress, taskProgress } from './structure'

type Props = {
  template: Template
  answers: Map<string, Answer>
  activePath: string
  linkTo: (path: string) => string
}

export function WorkbookNav({ template, answers, activePath, linkTo }: Props) {
  const activePhase = Number(activePath.split('.')[0])
  const navRef = useRef<HTMLDivElement>(null)

  // Keep the open task visible in a long index (the Phase I list does not fit on screen).
  useEffect(() => {
    navRef.current?.querySelector('[data-active]')?.scrollIntoView?.({ block: 'nearest' })
  }, [activePath])

  return (
    <Stack gap={2} component="nav" aria-label="Indice del workbook" ref={navRef}>
      <NavLink
        component={Link}
        to={linkTo('summary')}
        label="Riepilogo Go/No-Go"
        active={activePath === 'summary'}
        fw={500}
      />
      {template.phases.map((phase) => {
        const progress = phaseProgress(phase, answers)
        const status = phaseStatus(phase, answers)
        return (
          <NavLink
            key={phase.key}
            // A real button, so the expandable phase is reachable with the keyboard.
            component="button"
            type="button"
            // The right section of a collapsible NavLink is its (rotating) chevron, so the
            // progress badge goes in the label.
            label={
              <Group wrap="nowrap" gap="xs">
                <span style={{ flex: 1 }}>{phaseLabel(phase)}</span>
                {status && (
                  <Badge size="sm" color={VERDICT_COLOR[status]} style={{ flexShrink: 0 }}>
                    {VERDICT_LABEL[status]}
                  </Badge>
                )}
                <Badge
                  size="sm"
                  variant="light"
                  color={progress.answered === progress.total ? 'green' : 'gray'}
                  style={{ flexShrink: 0 }}
                >
                  {progress.answered}/{progress.total}
                </Badge>
              </Group>
            }
            defaultOpened={phase.number === activePhase}
            childrenOffset={12}
          >
            {phase.task_groups.map((group) => (
              <Stack key={group.key} gap={0} mt={4}>
                <Text size="xs" c="dimmed" tt="uppercase" px="sm" pt={4}>
                  {group.title}
                </Text>
                {group.tasks.map((task) => {
                  const path = `${phase.number}.${group.key}.${task.key}`
                  const { answered, total } = taskProgress(task, answers)
                  const done = total > 0 && answered === total
                  return (
                    <NavLink
                      key={path}
                      component={Link}
                      to={linkTo(path)}
                      label={task.title}
                      active={path === activePath}
                      rightSection={
                        done ? (
                          <Text size="xs" c="green" aria-label="completato">
                            ✓
                          </Text>
                        ) : total > 0 && answered > 0 ? (
                          <Text size="xs" c="dimmed">
                            {answered}/{total}
                          </Text>
                        ) : null
                      }
                    />
                  )
                })}
              </Stack>
            ))}
          </NavLink>
        )
      })}
    </Stack>
  )
}
