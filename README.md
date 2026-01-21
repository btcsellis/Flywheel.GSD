# Flywheel.GSD

Personal productivity system leveraging parallel AI agents to accelerate work.

## Overview

Flywheel.GSD centralizes work item management for multiple Claude Code sessions running across different project workspaces. Work flows through three stages:

```
backlog/ → active/ → done/
```

## Structure

```
/work/
  /backlog/    Work items ready to be picked up
  /active/     Work currently in progress
  /done/       Completed work (archive)
/skills/       Reusable agent skills (MD files)
/app/          Next.js dashboard
```

## Commands

Use these commands from any project workspace:

| Command | Description |
|---------|-------------|
| `/flywheel-start` | Initialize session, pick up work item |
| `/flywheel-plan` | Create new work item from conversation |
| `/flywheel-execute` | Execute current work item's plan |
| `/flywheel-ship` | Commit, push, create PR, complete work item |
| `/flywheel-cleanup` | Clean up after completion |

## Workflow

### 1. Create Work (Planning)

From any project, run `/flywheel-plan` to create a work item through conversation. The work item is saved to `work/backlog/`.

### 2. Pick Up Work (Starting)

In the target project, run `/flywheel-start`. This:
- Lists available work items for the project
- Moves selected item to `work/active/`
- Generates a PLAN.md in the project

### 3. Execute Work

Run `/flywheel-execute` to implement the plan autonomously. Both PLAN.md and the work item are updated with progress.

### 4. Ship Work

Run `/flywheel-ship` to:
- Commit changes
- Create a PR
- Move work item to `work/done/`

### 5. Cleanup

Run `/flywheel-cleanup` to remove worktrees and archive PLAN.md.

## Dashboard

The Next.js dashboard provides a web UI for managing work items.

### Running the Dashboard

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000

### Features

- **Dashboard**: Overview of active work, backlog stats, recent completions
- **Backlog**: View and prioritize pending work items
- **Active**: Monitor work in progress across sessions
- **Archive**: Browse completed work history
- **New**: Create work items via web form

## Setup

### Environment Variable

Set the path to this repo (optional, defaults to `~/personal/flywheel-gsd`):

```bash
export FLYWHEEL_GSD_PATH=~/personal/flywheel-gsd
```

### Symlink (Alternative)

```bash
ln -s ~/personal/flywheel-gsd ~/.flywheel-gsd
```

## Work Item Format

Work items are Markdown files with this structure:

```markdown
# [Title]

## Metadata
- id: [unique-identifier]
- project: [workspace/project-path]
- priority: low | medium | high | critical
- created: YYYY-MM-DD
- status: new | defined | planned | executing | review | done | blocked
- assigned-session: [session-id when picked up]

## Description
[What needs to be done and why]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
[Additional context]

## Execution Log
[Progress entries appended during execution]
```

## Project Identifiers

Work items target specific projects:
- `bellwether/BellwetherPlatform`
- `sophia/Sophia.Core`
- `sophia/Sophia.Api`
- `personal/flywheel-gsd`
