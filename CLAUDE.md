# Flywheel.GSD

Central hub for managing work items across multiple Claude Code sessions.

## Directory Structure

```
/work/
  /backlog/    Work items ready to be picked up
  /active/     Work currently in progress
  /done/       Completed work (archive)
/skills/       Reusable agent skills (MD files)
/app/          Next.js dashboard
/docs/         Architecture and reference docs
```

## Commands

- `/flywheel-new` - Create a new work item (minimal: title, project, priority, description)
- `/flywheel-define` - Define success criteria for a `new` work item
- `/flywheel-plan` - Create implementation plan for a `defined` work item
- `/flywheel-execute` - Execute current work item's plan
- `/flywheel-done` - Complete work item, commit, push, create PR
- `/flywheel-merge` - Merge all open PRs, sync local main, clean up artifacts

## Priority Levels

- **critical**: Drop everything, do this now
- **high**: Next up after current work
- **medium**: Standard priority
- **low**: Nice to have, do when time permits

## Project Identifiers

- `bellwether/BellwetherPlatform`
- `sophia/Sophia.Core`
- `sophia/Sophia.Api`
- `personal/flywheel-gsd`

## Reference Docs

- [Workflow details & work item template](docs/workflow-details.md)
- [Permissions architecture](docs/permissions-architecture.md)
