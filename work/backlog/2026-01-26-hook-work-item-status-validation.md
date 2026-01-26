# Hook: Work Item Status Validation

## Metadata
- id: hook-work-item-status-validation-801
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: new
- assigned-session:

## Description

Implement a PreToolUse hook that validates work item status transitions. Currently, invalid statuses can slip through because validation relies on prompts. This hook provides deterministic enforcement.

**Problem:** Invalid statuses can be written to work items (typos, invalid transitions like `new→executing`).

**Solution:** Hook intercepts Edit tool calls on work item files and validates:
- Status value is one of: `new`, `defined`, `planned`, `executing`, `review`, `done`, `blocked`
- Status transitions follow valid paths

**Hook type:** `PreToolUse` on `Edit` tool

**Behavior:**
- Trigger: Edit to files matching `work/**/*.md`
- Check: Parse old status from file, new status from edit
- Valid: Allow edit (exit 0)
- Invalid: Block edit with error message (exit 2)

## Success Criteria

- [ ] Hook script created in `flywheel-gsd/hooks/status-validation.sh`
- [ ] Hook configuration added to `.claude/settings.json`
- [ ] Blocks edits with invalid status values
- [ ] Blocks invalid status transitions (e.g., `new→executing`)
- [ ] Allows valid status transitions
- [ ] Clear error message when blocking

## Notes

Valid status values: `new`, `defined`, `planned`, `executing`, `review`, `done`, `blocked`

Valid transitions:
- `new` → `defined`
- `defined` → `planned`
- `planned` → `executing`
- `executing` → `review` | `blocked`
- `review` → `done`
- `blocked` → (any previous state)

## Execution Log

- 2026-01-26T14:00:00Z Work item created
