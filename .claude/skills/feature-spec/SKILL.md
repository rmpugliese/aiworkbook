---
name: feature-spec
description: Kicks off a new feature by finding the next incomplete phase in specs/roadmap.md, creating a git branch, interviewing the user about scope/decisions/context, and writing a dated spec directory under specs/ containing plan.md, requirements.md, and validation.md. Trigger when the user says "feature spec", "next phase", "prossima fase", "start the next feature", or invokes /feature-spec.
---

# Feature Spec

## Workflow

### 1. Find the next phase

Read `specs/roadmap.md`. The next phase is the first section whose items are all `[ ]`. Note its
number and name to derive the branch and directory name.

### 2. Create the branch

```
git checkout -b phase-N-<kebab-name>
```

### 3. Interview the user — BEFORE writing any files

Use `AskUserQuestion` with exactly **3 questions in one call**, in Italian:

| Header | Question focus |
|--------|---------------|
| **Scope** | What the feature collects, exposes, or does — fields, behaviour, data shape |
| **Decisions** | Key implementation choices — storage, visibility, validation, UX pattern |
| **Context** | Constraints or anything shaping the spec — copy style, stack limits, open questions |

Do **not** write any files until the user has answered all three questions.

### 4. Read guidance files

Read `specs/mission.md`, `specs/tech-stack.md` and `specs/workbook-model.md` before drafting.

### 5. Create the spec directory

Name: `specs/YYYY-MM-DD-<feature-name>/` using today's date. Write the files in Italian.

#### `requirements.md`
- Scope: what is and is not included; field/data table if applicable
- Decisions: choices made and why (draw from user answers)
- Context: stack pointers, existing patterns to follow, out of scope

#### `plan.md`
- Numbered task groups (e.g. Migrazione → Modelli → Servizi → Router API → Frontend → Test)
- Each group has numbered sub-tasks; groups should be independently implementable

#### `validation.md`
- Automated: `uv run pytest`, `uv run ruff check .`, `uv run mypy app` (backend) and
  `npm test`, `npm run typecheck` (frontend) all pass; specific assertions required
- Manual: walkthrough, behaviour, edge cases
- Security check when the feature touches auth, sharing or project data (ownership, tokens)
- Content check when the feature contains workbook text (paraphrased, no PMI text copied)
- Definition of done

## Constraints

- Respect `specs/tech-stack.md` — no new dependencies without user approval
- Follow existing conventions and patterns already established in the codebase
- Keep feature scope focused and independently shippable
