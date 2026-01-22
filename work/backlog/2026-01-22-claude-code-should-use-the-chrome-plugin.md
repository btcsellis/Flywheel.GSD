# Claude Code should use the chrome plugin more often

## Metadata
- id: claude-code-should-use-the-chrome-plugin-413
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: defined
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-claude-code-should-use-the-chrome-plugin-413
- assigned-session:

## Description

When a work item includes frontend changes, Claude Code should use the Chrome plugin to verify success during execution.

**Behavior:**
- During `/flywheel-plan`: Detect if the work item involves frontend changes (inferred from task description). If yes, include browser verification steps in the plan.
- During `/flywheel-execute`: Execute browser verification steps using `mcp__claude-in-chrome__*` tools. If Chrome plugin is unavailable, fail execution.

**Detection:** Frontend involvement is inferred from the work item description/goals before implementation begins (e.g., mentions UI, dashboard, components, styling, user-facing changes).

**Plan format:** Browser verification steps should be included in PLAN.md in whatever format makes them easiest for Claude Code to follow during execution.

## Success Criteria

- [ ] `/flywheel-plan` skill instructions updated to detect FE-related work items
- [ ] `/flywheel-plan` skill instructions include guidance on adding browser verification steps when FE is involved
- [ ] `/flywheel-execute` skill instructions updated to run browser verification steps using Chrome plugin
- [ ] `/flywheel-execute` fails if Chrome plugin is unavailable when browser verification is required
- [ ] Tested manually with a FE work item to confirm browser verification runs

## Notes

- Chrome plugin availability check: Call `mcp__claude-in-chrome__tabs_context_mcp` - if it errors, plugin is unavailable
- No skip flag for now - strict fail if Chrome unavailable and FE verification needed
- Can adjust failure behavior later based on real-world usage

## Execution Log

- 2026-01-22T16:31:06.048Z Work item created
- 2026-01-22T16:35:00.000Z Goals defined, success criteria added
