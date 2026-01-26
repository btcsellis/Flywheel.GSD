# /flywheel-done seems to hit a lot of errors cleaning up worktrees

## Metadata
- id: flywheel-done-seems-to-hit-a-lot-of-erro-280
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-flywheel-done-seems-to-hit-a-lot-of-erro-280
- assigned-session:

## Description

The `/flywheel-done` skill hits many errors when cleaning up worktrees. The root causes are:

1. **Shell cwd issue**: The skill tries to delete the worktree while the shell's cwd is still inside it, causing all subsequent commands to fail with "Path does not exist"
2. **Orphaned worktrees**: Git sometimes loses track of worktrees, causing `git worktree remove` to fail with "not a working tree"
3. **No retry limit**: The skill keeps retrying the same failing commands

### Solution Approach

Update the `/flywheel-done` skill instructions to:
1. **cd to main repo first** - Before any cleanup, cd to the main repo to avoid cwd issues
2. **Run `git worktree prune`** - Clean up orphaned worktree references before removal
3. **Handle errors gracefully** - If `git worktree remove` fails, fall back to `rm -rf`
4. **Add guidance on retries** - Instruct to not retry the same failing command more than once

## Success Criteria

- [x] `/flywheel-done` skill instructions updated with robust worktree cleanup steps
- [x] Cleanup process starts by cd'ing to main repo (avoids cwd issues)
- [x] `git worktree prune` is run before attempting removal
- [x] Fallback to `rm -rf` when `git worktree remove` fails
- [x] Instructions include guidance to not retry failing commands more than once
- [x] Manual test: run `/flywheel-done` on a worktree workflow and verify clean completion

## Implementation Plan

### Phase 1: Update Worktree Cleanup Section

**File to modify:** `~/.claude/commands/flywheel-done.md`

1. **Replace the "If workflow is `worktree`" cleanup section (lines 166-184)**

   Current code:
   ```bash
   WORKTREE_PATH=$(pwd)
   MAIN_PROJECT=$(git worktree list | head -1 | awk '{print $1}')
   BRANCH=$(git branch --show-current)
   cd "$MAIN_PROJECT"
   git worktree remove "$WORKTREE_PATH" --force
   git branch -d "$BRANCH" 2>/dev/null || git branch -D "$BRANCH"
   ```

   New code should:
   - Capture worktree path and branch BEFORE cd'ing
   - cd to main project FIRST (already documented but easy to miss)
   - Run `git worktree prune` to clean up stale references
   - Try `git worktree remove` first
   - If that fails, fall back to `rm -rf` with absolute path
   - Delete the branch (handle already-deleted gracefully)

2. **Add explicit error handling guidance**

   Add a new subsection under the cleanup section explaining:
   - If `git worktree remove` fails with "not a working tree", use `rm -rf`
   - Do not retry the same failing command more than once
   - If cleanup fails entirely, report the issue and instruct user to manually clean up

### Phase 2: Add Retry Guidance to Key Rules

3. **Update Key Rules section**

   Add a new rule about retries:
   - "Do NOT retry the same failing cleanup command more than once - if it fails, try the fallback approach or report the issue"

### Verification

After editing `flywheel-done.md`:
- Read the file back to confirm changes are correct
- This work item itself uses worktree workflow, so `/flywheel-done` will be the real test

## Notes

The original error transcript showed:
- 20+ repeated "Path does not exist" errors from broken shell cwd
- `git worktree remove` failing because worktree was already orphaned
- Eventually succeeded with `/bin/rm -rf` using absolute path

Key insight: the shell's cwd becomes invalid when the worktree directory is deleted or becomes orphaned, causing all bash commands to fail until cwd is reset.

**Current skill location:** `~/.claude/commands/flywheel-done.md`

## Execution Log

- 2026-01-22T17:19:49.992Z Work item created
- 2026-01-22 Goals defined, success criteria added
- 2026-01-22 Implementation plan created
- 2026-01-22 Transitioned to executing, moved to active/
- 2026-01-22 Updated flywheel-done.md worktree cleanup section with:
  - git worktree prune before removal
  - Fallback to rm -rf when git worktree remove fails
  - Error handling guidance
  - Key Rule #6 about not retrying failing commands
- 2026-01-22 All implementation criteria verified, ready for /flywheel-done
- 2026-01-22 Work item completed (no PR - changes are in ~/.claude/commands/)
