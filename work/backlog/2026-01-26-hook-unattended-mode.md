# Hook: Unattended Mode via Stop Hook

## Metadata
- id: hook-unattended-mode-803
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: new
- assigned-session:

## Description

Implement a Stop hook that handles unattended mode, replacing/augmenting the current prompt-based implementation. Hooks are more reliable than prompt instructions.

**Problem:** Unattended mode is currently implemented via prompt instructions in flywheel-define.md and flywheel-plan.md. Prompt-based is fragile - Claude might not follow instructions consistently.

**Solution:** Stop hook intercepts when Claude finishes and checks if workflow should continue automatically.

**Hook type:** `Stop`

**Behavior:**
- Trigger: Claude finishes responding
- Check: Read current work item, check for `unattended: true` flag
- If unattended AND status is `defined` → Block stop, output context to run `/flywheel-plan`
- If unattended AND status is `planned` → Block stop, output context to run `/flywheel-execute`
- If status is `review` or no unattended flag → Allow stop (exit 0)

**Key insight:** Exit code 2 blocks Claude from stopping, forcing continuation.

## Success Criteria

- [ ] Hook script created in `flywheel-gsd/hooks/unattended-mode.sh`
- [ ] Hook configuration added to `.claude/settings.json`
- [ ] Detects `unattended: true` flag in work item metadata
- [ ] Blocks stop and triggers `/flywheel-plan` after define completes
- [ ] Blocks stop and triggers `/flywheel-execute` after plan completes
- [ ] Allows stop at `review` status (doesn't auto-run `/flywheel-done`)
- [ ] Works correctly when unattended flag is not present (normal behavior)
- [ ] Consider removing prompt-based unattended logic after hook is validated

## Notes

This may replace the prompt-based implementation added in `feature-run-unattended-741`. Test both approaches and decide which to keep.

The Stop hook can output context that Claude will see, enabling it to understand what to do next.

## Execution Log

- 2026-01-26T14:00:00Z Work item created
