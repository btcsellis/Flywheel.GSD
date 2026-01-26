# Flywheel.GSD

Central hub for managing work items across multiple Claude Code sessions.

## Overview

This repo serves as the source of truth for work items (tasks, features, bugs) that can be picked up by Claude Code sessions running in different project workspaces. Work flows through three stages:

```
backlog/ → active/ → done/
```

## Directory Structure

```
/work/
  /backlog/    Work items ready to be picked up
  /active/     Work currently in progress
  /done/       Completed work (archive)
/skills/       Reusable agent skills (MD files)
/app/          Next.js dashboard
```

## Work Item Format

Files in `/work/` follow this naming convention:
`YYYY-MM-DD-short-description.md`

### Work Item Template

```markdown
# [Title]

## Metadata
- id: [unique-identifier]
- project: [workspace/project-path]
- priority: low | medium | high | critical
- created: YYYY-MM-DD
- status: new | defined | planned | review | done | blocked
- assigned-session: [optional - session identifier when picked up]

## Description
[What needs to be done and why]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Notes
[Additional context, considerations, links]

## Execution Log
[Append progress entries here]
- [timestamp] Picked up by session X
- [timestamp] Completed criterion 1
- [timestamp] PR created: [url]
```

## Workflow Steps

Work items progress through these stages:

1. **New** - Initial capture, needs goals defined
2. **Defined** - Success criteria defined, ready to plan
3. **Planned** - Plan created, ready to execute (stays here during execution with gradient animation)
4. **Review** - Execution complete, verifying success criteria
5. **Done** - Verified, shipped, cleaned up

Items can also be **Blocked** at any stage if stuck.

## Commands

Use these commands from any project workspace:

- `/flywheel-new` - Create a new work item (minimal: title, project, priority, description)
- `/flywheel-define` - Define success criteria for a `new` work item
- `/flywheel-plan` - Create implementation plan for a `defined` work item
- `/flywheel-execute` - Execute current work item's plan
- `/flywheel-done` - Complete work item, commit, push, create PR

## Creating Work Items

**IMPORTANT:** When asked to create a new work item, always use `/flywheel-new`.

Do NOT manually create work item files or add fields like `workflow`, `tmux-session`, `assigned-session`, or success criteria. These are set by later commands in the workflow.

`/flywheel-new` collects only:
- Title
- Project
- Priority
- Brief description

Then run `/flywheel-define` → `/flywheel-plan` → `/flywheel-execute` → `/flywheel-done`.

## Workflow

### Creating Work

1. From any project, run `/flywheel-new`
2. Provide title, project, priority, and brief description
3. Work item created in `flywheel-gsd/work/backlog/` with status `new`

### Picking Up Work

1. In target project, run `/flywheel-start`
2. Lists available work items for that project
3. Select one → generates PLAN.md in project
4. Work item moves to `active/` with session assignment

### Completing Work

1. Run `/flywheel-execute` to implement the plan
2. Run `/flywheel-ship` to commit and create PR
3. Work item moves to `done/` with PR link

## Dashboard

The Next.js app at `/app/` provides:
- Dashboard with active work and stats
- Backlog management with prioritization
- Work item creation form
- Archive view

### Running the Dashboard

```bash
cd app
npm run dev
```

## Integration with Other Projects

Each project workspace should have a symlink or reference to this repo:

```bash
# Option 1: Symlink
ln -s ~/personal/flywheel-gsd ~/.flywheel-gsd

# Option 2: Environment variable
export FLYWHEEL_GSD_PATH=~/personal/flywheel-gsd
```

## Session Locking

When a session picks up a work item:
1. Work item moves from `backlog/` to `active/`
2. `assigned-session` field is populated
3. Other sessions see it as taken

Sessions can release work items back to backlog if interrupted.

## Priority Levels

- **critical**: Drop everything, do this now
- **high**: Next up after current work
- **medium**: Standard priority
- **low**: Nice to have, do when time permits

## Project Identifiers

Work items target specific projects using identifiers:
- `bellwether/BellwetherPlatform`
- `sophia/Sophia.Core`
- `sophia/Sophia.Api`
- `personal/flywheel-gsd`

Match against workspace path to filter relevant work.
