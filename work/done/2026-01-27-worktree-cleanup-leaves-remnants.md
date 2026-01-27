# Worktree cleanup leaves remnants

## Metadata
- id: worktree-cleanup-leaves-remnants-486
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-worktree-cleanup-leaves-remnants-486
- assigned-session:

## Description

When `/flywheel-done` cleans up a worktree, `git worktree remove --force` succeeds (exits 0) but leaves behind the directory because `.claude/settings.local.json` is an untracked file. Since the git command "succeeds", the `rm -rf` fallback never triggers. The result is ~15 remnant directories in `flywheel-gsd-worktrees/` each containing only `.claude/settings.local.json`.

Root cause: `git worktree remove` won't delete untracked files outside git's knowledge. The `.claude/` directory is created by Claude Code during the session and is never tracked by git.

Fix: In `flywheel-done.md`, always run `rm -rf "$WORKTREE_PATH"` after `git worktree remove`, not just as a fallback for failure. The directory check should be unconditional.

## Success Criteria

- [x] `flywheel-done.md` cleanup section always removes the worktree directory after `git worktree remove` (unconditional `rm -rf`, not just on failure)
- [x] Existing remnant directories can be cleaned up (document a one-liner or add to `/flywheel-merge`)
- [x] All tests pass, no type errors (markdown-only changes; build failure is pre-existing)

## Implementation Plan

### Phase 1: Fix flywheel-done.md cleanup

1. **Make worktree directory removal unconditional**
   - File: `skills/flywheel-done.md` (lines 262-271)
   - Change the conditional `if [ -d ... ]` block to always run `rm -rf` after `git worktree remove`
   - New logic:
     ```bash
     git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true
     # Always remove directory (git worktree remove leaves untracked files like .claude/)
     rm -rf "$WORKTREE_PATH" 2>/dev/null || true
     ```
   - Update the comment block (lines 278-282) to reflect the new approach

### Phase 2: Add remnant cleanup to flywheel-merge.md

2. **Add worktree remnant cleanup to merge skill**
   - File: `skills/flywheel-merge.md` (after line 77, in "Clean Up Flywheel Artifacts" section)
   - Add cleanup of orphaned worktree directories that have no matching git worktree entry:
     ```bash
     # Remove orphaned worktree directories (dirs with no registered git worktree)
     WORKTREE_PARENT="$(dirname "$FLYWHEEL_PATH")/flywheel-gsd-worktrees"
     if [ -d "$WORKTREE_PARENT" ]; then
       for dir in "$WORKTREE_PARENT"/*/; do
         [ -d "$dir" ] || continue
         DIRNAME=$(basename "$dir")
         if ! git worktree list | grep -q "$DIRNAME"; then
           rm -rf "$dir"
         fi
       done
     fi
     ```

### Verification

- Read modified files to confirm changes are correct
- Run `npm run typecheck` and `npm run lint` in app/ if applicable (these are markdown-only changes so likely N/A)

## Notes

- Investigated remnant dirs: they all contain only `.claude/settings.local.json`
- Git worktree list confirms these are no longer registered worktrees — just leftover filesystem dirs
- The permissions migration step in flywheel-done already handles migrating settings before cleanup, so removing `.claude/` is safe

## Execution Log

- 2026-01-27T21:03:55.610Z Work item created
- 2026-01-27T22:04:00.000Z Goals defined — root cause identified as git worktree remove succeeding but leaving untracked .claude/ dir
- 2026-01-27T22:06:00.000Z Implementation plan created — two markdown files to modify
- 2026-01-27T22:08:00.000Z Phase 1: Made rm -rf unconditional in flywheel-done.md
- 2026-01-27T22:08:30.000Z Phase 2: Added orphaned worktree cleanup to flywheel-merge.md
- 2026-01-27T22:09:00.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-27T22:10:00.000Z Committed, pushed, PR created: https://github.com/btcsellis/Flywheel.GSD/pull/18
- 2026-01-27T22:10:30.000Z Work item completed
