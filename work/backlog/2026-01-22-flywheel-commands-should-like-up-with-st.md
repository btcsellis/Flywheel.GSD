# Align Flywheel commands with status changes

## Metadata
- id: flywheel-commands-should-like-up-with-st-717
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: defined
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Restructure the Flywheel slash commands to align 1:1 with workflow statuses. Commands become the single source of truth for workflow logic, with the dashboard importing/referencing them.

## Success Criteria

- [ ] `/flywheel-new` command created - creates new work item in backlog with status `new`
- [ ] `/flywheel-define` command created - asks clarifying questions, defines success criteria, transitions `new` → `defined`
- [ ] `/flywheel-plan` command updated - explores code, creates implementation plan, transitions `defined` → `planned`
- [ ] `/flywheel-execute` command updated - implements plan autonomously, transitions `planned` → `executing` → `review`
- [ ] `/flywheel-done` command created - commits, pushes, creates PR, archives work item, transitions `review` → `done`
- [ ] Old commands removed: `/flywheel-start`, `/flywheel-ship`, `/flywheel-cleanup`
- [ ] `prompts.ts` updated to use command files as source of truth
- [ ] Dashboard status action buttons work correctly with new command structure



## Execution Log

- 2026-01-22T13:26:11.095Z Work item created
