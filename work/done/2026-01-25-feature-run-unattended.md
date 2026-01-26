# Feature - run unattended

## Metadata
- id: feature-run-unattended-741
- project: personal/flywheel-gsd
- created: 2026-01-25
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

For certain tasks, flywheel should automatically proceed through workflow steps without requiring manual command invocation between each step.

**Behavior:**
- When a work item has `unattended: true` flag, after `/flywheel-define` completes:
  - Automatically run `/flywheel-plan`
  - Then automatically run `/flywheel-execute`
  - Stop at `review` status (user manually runs `/flywheel-done`)
- Normal pausing behavior is preserved (questions, confirmations, errors)
- Only the manual command invocation between steps is eliminated

**Scope:** `main` workflow only for v1.

## Success Criteria

- [x] Work items can have `- unattended: true` metadata flag
- [x] `/flywheel-define` checks for unattended flag after transitioning to `defined`
- [x] If unattended, `/flywheel-define` automatically invokes `/flywheel-plan`
- [x] `/flywheel-plan` checks for unattended flag after transitioning to `planned`
- [x] If unattended, `/flywheel-plan` automatically invokes `/flywheel-execute`
- [x] `/flywheel-execute` stops at `review` status (no auto-invoke of `/flywheel-done`)
- [x] On error, execution stops and waits for input (same as today)
- [x] Questions/confirmations still pause for user input (same as today)
- [x] Works only for `main` workflow (worktree not required)

## Notes

- This is about eliminating the manual `/flywheel-plan` and `/flywheel-execute` commands between steps
- Not about eliminating user interaction during those steps
- `/flywheel-done` is always manual (involves commit, push, potential review)

## Implementation Plan

### Phase 1: Update flywheel-define.md

1. **Add unattended check after status transition**
   - File: `~/.claude/commands/flywheel-define.md`
   - After "### 5. Confirm Definition" section, add new section "### 6. Check for Unattended Mode"
   - Check if work item has `- unattended: true` in metadata
   - Check if workflow is `main` (unattended only supported for main workflow in v1)
   - If both conditions met, invoke `/flywheel-plan` using the Skill tool
   - Verification: Read the file and confirm section exists

### Phase 2: Update flywheel-plan.md

2. **Add unattended check after status transition**
   - File: `~/.claude/commands/flywheel-plan.md`
   - After "### 6. Report" section, add new section "### 7. Check for Unattended Mode"
   - Check if work item has `- unattended: true` in metadata
   - Check if workflow is `main`
   - If both conditions met, invoke `/flywheel-execute` using the Skill tool
   - Verification: Read the file and confirm section exists

### Phase 3: Verify flywheel-execute.md (no changes needed)

3. **Confirm flywheel-execute stops at review**
   - File: `~/.claude/commands/flywheel-execute.md`
   - Verify it already stops at `review` status
   - No auto-invoke of `/flywheel-done`
   - Verification: Read file and confirm no auto-continuation

### Verification

- Read all three command files to confirm changes
- The unattended flag is just a metadata field - no validation needed (markdown is flexible)
- Manual testing would require creating a work item with `unattended: true` and running through the flow

## Execution Log

- 2026-01-25T18:17:21.696Z Work item created
- 2026-01-25T18:20:00Z Goals defined, success criteria added
- 2026-01-25T18:22:00Z Implementation plan created
- 2026-01-25T18:25:00Z Phase 1: Updated flywheel-define.md with unattended mode check
- 2026-01-25T18:26:00Z Phase 2: Updated flywheel-plan.md with unattended mode check
- 2026-01-25T18:27:00Z Phase 3: Verified flywheel-execute.md already stops at review
- 2026-01-25T18:28:00Z All success criteria verified
- 2026-01-25T18:28:00Z Ready for /flywheel-done
- 2026-01-25T18:30:00Z Work item completed
