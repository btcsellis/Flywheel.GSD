# Give instructions for Claude Code to use when creating new work items

## Metadata
- id: give-instructions-for-claude-code-to-use-660
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-give-instructions-for-claude-code-to-use-660
- assigned-session:

## Description

Claude Code was incorrectly setting fields like `workflow`, `tmux-session`, `assigned-session`, and success criteria when creating work items from ad hoc prompts instead of using `/flywheel-new`. Solution: Add clear instructions to CLAUDE.md telling Claude to always use `/flywheel-new` for creating work items.

## Success Criteria

- [x] CLAUDE.md updated with instruction to always use `/flywheel-new` when creating work items
- [x] CLAUDE.md clarifies which fields `/flywheel-new` collects (title, project, priority, description only)
- [x] Commands section accurately describes each flywheel command

## Execution Log

- 2026-01-26T14:41:20.443Z Work item created
- 2026-01-26 Goals defined, CLAUDE.md updated with `/flywheel-new` instructions
- 2026-01-26 Committed and pushed
- 2026-01-26 PR created: https://github.com/btcsellis/Flywheel.GSD/pull/9
- 2026-01-26 Work item completed
