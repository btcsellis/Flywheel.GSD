# Bug - execute still try to use Executing status

## Metadata
- id: bug-execute-still-try-to-use-executing-s-448
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-bug-execute-still-try-to-use-executing-s-448
- assigned-session:

## Description

When I go from planned to execute, the work item is put into an executing status, which doesn't exist. Then the dashboard breaks.

**Root Cause:** The `/flywheel-execute` command file (`~/.claude/commands/flywheel-execute.md`) was not updated when the `executing` status was removed from the codebase. The command still:
- Transitions items to `executing` status (which no longer exists in `WorkItemStatus`)
- Contains sed commands that try to manipulate `executing` status
- References the old workflow: `planned → executing → review`

The dashboard breaks because it tries to display a status that isn't in the valid status list.

## Success Criteria

- [x] `flywheel-execute.md` updated to keep items in `planned` status during execution
- [x] All references to `executing` status removed from `flywheel-execute.md`
- [x] Status transition documentation updated to `planned → review`
- [x] Blocked items correctly transition back to `planned` (not `executing`)
- [x] Dashboard does not break when running `/flywheel-execute`
- [x] Work items transition directly from `planned` to `review` on completion

## Notes

- The fix from work item `remove-executing-column-636` updated the app code but missed the command file
- Command files live in `~/.claude/commands/` (global Claude config)
- The gradient animation for in-progress items already works on `planned` status
- No code changes needed in `/app` - only the command markdown file needs updating

## Implementation Plan

### Phase 1: Remove `executing` Status References

The file `~/.claude/commands/flywheel-execute.md` needs the following updates:

1. **Update header description (line 3)**
   - Change: `transitioning \`planned\` → \`executing\` → \`review\``
   - To: `transitioning \`planned\` → \`review\` (items stay in \`planned\` during execution)`

2. **Update work item search (lines 22-25)**
   - Change: `Or find a \`planned\` or \`executing\` work item:`
   - To: `Or find a \`planned\` work item:`
   - Change grep pattern: `(planned|executing)` → `planned`

3. **Remove "Transition to Executing" section (lines 37-42)**
   - Change section title: `### 2. Transition to Executing`
   - To: `### 2. Prepare for Execution`
   - Remove the sed command that changes status to executing
   - Keep the move-to-active logic (lines 44-48)

4. **Update transition to review (line 204)**
   - Change: `sed -i '' 's/- status: executing/- status: review/'`
   - To: `sed -i '' 's/- status: planned/- status: review/'`

5. **Update blocked transition (line 258)**
   - Change: `sed -i '' 's/- status: executing/- status: blocked/'`
   - To: `sed -i '' 's/- status: planned/- status: blocked/'`

6. **Update status transitions documentation (lines 262-271)**
   - Change: `planned → executing → review`
   - To: `planned → review`
   - Change: `planned → executing → blocked`
   - To: `planned → blocked`

### Verification

- Read the updated file and confirm no references to `executing` remain
- The command file should only reference valid statuses: `new`, `defined`, `planned`, `review`, `done`, `blocked`

## Execution Log

- 2026-01-26T14:22:14.659Z Work item created
- 2026-01-26 Goals defined, root cause identified, success criteria added
- 2026-01-26 Implementation plan created
- 2026-01-26 Updated header description to show `planned → review` flow
- 2026-01-26 Removed `executing` from work item search pattern
- 2026-01-26 Renamed "Transition to Executing" section to "Prepare for Execution", removed status change sed
- 2026-01-26 Updated review transition: `planned → review`
- 2026-01-26 Updated blocked transition: `planned → blocked`
- 2026-01-26 Updated status transitions documentation
- 2026-01-26 Verified: grep for "executing" returns no matches in flywheel-execute.md
- 2026-01-26 All success criteria verified, ready for /flywheel-done
- 2026-01-26 Work item completed (fix applied to ~/.claude/commands/flywheel-execute.md)
