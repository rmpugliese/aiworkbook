import type { Answer } from '../api/answers'
import type { Phase, Task, TaskGroup, Template } from '../api/template'

/** A task with its position in the workbook. `path` is "<phase>.<group>.<task>". */
export type TaskRef = { path: string; phase: Phase; group: TaskGroup; task: Task }

export function flattenTasks(template: Template): TaskRef[] {
  return template.phases.flatMap((phase) =>
    phase.task_groups.flatMap((group) =>
      group.tasks.map((task) => ({
        path: `${phase.number}.${group.key}.${task.key}`,
        phase,
        group,
        task,
      })),
    ),
  )
}

export function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false
  return Boolean(answer.text?.trim() || answer.verdict || answer.choices?.length)
}

export type Progress = { answered: number; total: number }

export function taskProgress(task: Task, answers: Map<string, Answer>): Progress {
  return {
    answered: task.questions.filter((q) => isAnswered(answers.get(q.key))).length,
    total: task.questions.length,
  }
}

export function phaseProgress(phase: Phase, answers: Map<string, Answer>): Progress {
  const tasks = phase.task_groups.flatMap((group) => group.tasks)
  return tasks.reduce(
    (sum, task) => {
      const progress = taskProgress(task, answers)
      return { answered: sum.answered + progress.answered, total: sum.total + progress.total }
    },
    { answered: 0, total: 0 },
  )
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const

export function phaseLabel(phase: Phase): string {
  return `Fase ${ROMAN[phase.number - 1]} · ${phase.title}`
}
