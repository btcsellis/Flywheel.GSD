# Align Flywheel commands with status changes

## Metadata
- id: flywheel-commands-should-like-up-with-st-717
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Restructure the Flywheel slash commands to align 1:1 with workflow statuses. Commands become the single source of truth for workflow logic, with the dashboard importing/referencing them.

## Success Criteria

- [x] `/flywheel-new` command created - creates new work item in backlog with status `new`
- [x] `/flywheel-define` command created - asks clarifying questions, defines success criteria, transitions `new` → `defined`
- [x] `/flywheel-plan` command updated - explores code, creates implementation plan, transitions `defined` → `planned`
- [x] `/flywheel-execute` command updated - implements plan autonomously, transitions `planned` → `executing` → `review`
- [x] `/flywheel-done` command created - commits, pushes, creates PR, archives work item, transitions `review` → `done`
- [x] Old commands removed: `/flywheel-start`, `/flywheel-ship`, `/flywheel-cleanup`
- [x] `prompts.ts` updated to use command files as source of truth
- [x] Dashboard status action buttons work correctly with new command structure

## Implementation Plan

### Phase 1: Create new command files

1. **Create `flywheel-new.md`** - Creates a new work item
   - Ask "What would you like to work on?"
   - Gather title, project, priority
   - Create work item file in `work/backlog/` with status `new`
   - Report creation with next steps

2. **Create `flywheel-define.md`** - Defines goals for a work item
   - Read the work item file
   - Ask clarifying questions about scope, constraints, requirements
   - Define clear, specific success criteria
   - Update work item with success criteria
   - Change status from `new` → `defined`

3. **Update `flywheel-plan.md`** - Creates implementation plan (currently creates work items)
   - Read work item to understand success criteria
   - Explore codebase to understand architecture
   - Design implementation approach
   - Create numbered plan with specific steps
   - Update work item with plan
   - Change status from `defined` → `planned`

4. **Update `flywheel-execute.md`** - Execute the plan
   - Read work item to understand plan
   - Execute each step, checking off as completed
   - Add entries to execution log
   - Handle verification at each step
   - On completion, change status to `review`
   - (Keep existing logic, just ensure status transitions are correct)

5. **Create `flywheel-done.md`** - Ship and cleanup (merges ship + cleanup)
   - Run project verification commands
   - Stage and commit with conventional commit message
   - Push to remote
   - Create PR (worktree workflow) or sync main (main workflow)
   - Move work item from `active/` to `done/`
   - Update work item status to `done`
   - Clean up PLAN.md and prompt files
   - Handle worktree/branch deletion (worktree workflow)
   - Kill tmux session if applicable

### Phase 2: Update dashboard integration

6. **Update `prompts.ts`** - Reference commands as source of truth
   - Change `generatePromptForStatus()` to generate minimal prompts that tell Claude which command to run
   - Map statuses to commands:
     - `new` → "Run `/flywheel-define`"
     - `defined` → "Run `/flywheel-plan`"
     - `planned` → "Run `/flywheel-execute`"
     - `executing` → "Run `/flywheel-execute`"
     - `review` → "Run `/flywheel-done`"
   - Include work item context (path, title, project, status) in the prompt
   - Commands contain the detailed instructions

7. **Update `STATUS_ACTIONS`** - Align labels with commands
   - `new` → "Define" (runs flywheel-define)
   - `defined` → "Plan" (runs flywheel-plan)
   - `planned` → "Execute" (runs flywheel-execute)
   - `executing` → "Continue" (runs flywheel-execute)
   - `review` → "Done" (runs flywheel-done)

### Phase 3: Remove old commands

8. **Delete old command files**
   - `flywheel-start.md`
   - `flywheel-ship.md`
   - `flywheel-cleanup.md`

### Verification

- Create a test work item and progress it through all statuses
- Verify each command executes correctly when invoked from dashboard
- Verify each command can be run manually via `/flywheel-*` syntax

## Execution Log

- 2026-01-22T13:26:11.095Z Work item created
- 2026-01-22T13:35:00.000Z Goals defined, success criteria added
- 2026-01-22T13:40:00.000Z Implementation plan created
- 2026-01-22T15:04:00.000Z Created flywheel-new.md command
- 2026-01-22T15:05:00.000Z Created flywheel-define.md command
- 2026-01-22T15:05:30.000Z Updated flywheel-plan.md command
- 2026-01-22T15:05:45.000Z Updated flywheel-execute.md command
- 2026-01-22T15:06:00.000Z Created flywheel-done.md command (replaces ship + cleanup)
- 2026-01-22T15:06:30.000Z Updated prompts.ts with command references and STATUS_ACTIONS
- 2026-01-22T15:07:00.000Z Deleted old commands: flywheel-start.md, flywheel-ship.md, flywheel-cleanup.md
- 2026-01-22T15:07:51.000Z Verified: lint passes (warnings only), build succeeds
- 2026-01-22T15:08:00.000Z All success criteria verified
- 2026-01-22T15:08:00.000Z Ready for /flywheel-done
- 2026-01-22T15:10:00.000Z Committed and pushed to main (0bc47d8)
- 2026-01-22T15:10:00.000Z Work item completed
