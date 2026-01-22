# Claude Code should use the chrome plugin more often

## Metadata
- id: claude-code-should-use-the-chrome-plugin-413
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: executing
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

## Implementation Plan

### Phase 1: Update flywheel-plan.md

1. **Add FE detection guidance**
   - Add a new section after "### 3. Design Implementation Approach"
   - Instructions to identify if work item involves frontend changes
   - Detection based on: mentions of UI, dashboard, components, styling, pages, user-facing changes, visual elements
   - File: `~/.claude/commands/flywheel-plan.md`

2. **Add browser verification section template**
   - Add guidance in "### 4. Create the Implementation Plan"
   - When FE detected, plan must include a `## Browser Verification` section
   - Template for verification steps (navigate, check elements, interactions)
   - File: `~/.claude/commands/flywheel-plan.md`

### Phase 2: Update flywheel-execute.md

3. **Add Chrome plugin availability check**
   - Add new section after "### 2. Transition to Executing"
   - If plan contains `## Browser Verification`, check Chrome plugin availability
   - Call `mcp__claude-in-chrome__tabs_context_mcp` - if it errors, fail execution
   - Clear error message explaining Chrome plugin is required
   - File: `~/.claude/commands/flywheel-execute.md`

4. **Add browser verification execution step**
   - Add new section after "### 5. Verify Success Criteria"
   - Execute each step in `## Browser Verification` section using Chrome plugin tools
   - Use `mcp__claude-in-chrome__navigate`, `mcp__claude-in-chrome__read_page`, `mcp__claude-in-chrome__find`, etc.
   - Log results in execution log
   - File: `~/.claude/commands/flywheel-execute.md`

### Phase 3: Manual Testing

5. **Test with FE work item**
   - Create or use a simple FE work item
   - Run `/flywheel-plan` and verify browser verification section is generated
   - Run `/flywheel-execute` and verify Chrome plugin is used
   - Verify failure behavior when Chrome unavailable

### Verification

- Read updated `flywheel-plan.md` and confirm FE detection + browser verification template sections exist
- Read updated `flywheel-execute.md` and confirm Chrome check + browser verification execution sections exist
- Manual test with a FE-related work item

## Execution Log

- 2026-01-22T16:31:06.048Z Work item created
- 2026-01-22T16:35:00.000Z Goals defined, success criteria added
- 2026-01-22T16:40:00.000Z Implementation plan created
