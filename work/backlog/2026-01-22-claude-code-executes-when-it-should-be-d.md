# Claude Code executes when it should be defining or planning

## Metadata
- id: claude-code-executes-when-it-should-be-d-370
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: defined
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-claude-code-executes-when-it-should-be-d-370
- assigned-session:

## Description

Claude Code sometimes jumps ahead to writing code during `/flywheel-define` or `/flywheel-plan` phases when it should only be working with markdown files (work item files and PLAN.md).

The skills need stronger guardrails to enforce the separation of concerns:
- **define**: Only ask questions and update the work item markdown
- **plan**: Only create/update PLAN.md and update work item status
- **execute**: This is the ONLY phase that should write code

## Success Criteria

- [ ] `/flywheel-define` skill has explicit "DO NOT" statements prohibiting code file edits
- [ ] `/flywheel-plan` skill has explicit "DO NOT" statements prohibiting code file edits
- [ ] Both skills specify that only `.md` files in the work item path or PLAN.md should be modified
- [ ] Both skills include a clear "What this command does NOT do" section
- [ ] Language is direct and unambiguous (e.g., "NEVER", "ONLY", "DO NOT")

## Notes

- This is a prompt engineering fix, not a code change
- The goal is to make the boundaries crystal clear so Claude doesn't get confused about what phase it's in
- Skill files are in `/skills/` directory

## Execution Log

- 2026-01-22T16:28:31.858Z Work item created
- 2026-01-22 Defined: Added success criteria for enforcing phase boundaries in flywheel skills
