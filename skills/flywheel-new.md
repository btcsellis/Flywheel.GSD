# Flywheel: New Work Item

Create a new work item in the Flywheel backlog with status `new`.

## Environment

```bash
FLYWHEEL_PATH="${FLYWHEEL_GSD_PATH:-$HOME/personal/flywheel-gsd}"
TODAY=$(date +%Y-%m-%d)
```

## Process

### 1. Gather Basic Info

Ask: "What would you like to work on?"

Collect:
- **Title**: Clear, concise description of the work
- **Project**: Which project is this for?
- **Priority**: low | medium | high | critical

Don't ask for success criteria yet - that's the `/flywheel-define` step.

### 2. Determine Target Project

Infer from conversation or ask:
- `bellwether/BellwetherPlatform`
- `sophia/Sophia.Core`
- `sophia/Sophia.Api`
- `personal/[project-name]`
- Other (specify path)

### 3. Generate Work Item ID

Format: `[short-name]-[random-3-digits]`
Example: `auth-refactor-042`, `api-pagination-718`

### 4. Create Work Item

Create file at: `$FLYWHEEL_PATH/work/backlog/[TODAY]-[short-description].md`

```markdown
# [Clear Title]

## Metadata
- id: [generated-id]
- project: [target-project-path]
- priority: [low|medium|high|critical]
- created: [TODAY]
- status: new
- workflow:
- tmux-session:
- assigned-session:

## Description

[Brief description of what needs to be done]

## Success Criteria

[To be defined - run /flywheel-define]

## Notes

[Any initial context from the conversation]

## Execution Log

- [timestamp] Work item created
```

### 5. Confirm Creation

```bash
ls -la "$FLYWHEEL_PATH/work/backlog/"
```

Report:
```markdown
## Work Item Created

**File**: [filename]
**ID**: [id]
**Project**: [project]
**Priority**: [priority]
**Status**: new

### Next Steps
Run `/flywheel-define` to define success criteria and goals.
```

## Key Differences from Previous `/flywheel-plan`

- **Minimal info gathering** - just title, project, priority
- **No success criteria** - that comes in `/flywheel-define`
- **No implementation details** - that comes in `/flywheel-plan`
- **Status is `new`** - not `ready` or `defined`

## Priority Guidelines

| Priority | When to Use |
|----------|-------------|
| critical | Production issues, blocking other work |
| high | Important features, significant bugs |
| medium | Standard development work |
| low | Nice to have, refactoring, tech debt |

## Work Item Naming

File naming: `YYYY-MM-DD-short-description.md`
- Use lowercase
- Use hyphens for spaces
- Keep it short but descriptive
- Include date for sorting

Examples:
- `2025-01-20-add-user-auth.md`
- `2025-01-20-fix-pagination-bug.md`
- `2025-01-20-refactor-api-routes.md`
