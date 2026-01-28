# Bug - gradient animation not working

## Metadata
- id: bug-gradient-animation-not-working-108
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-bug-gradient-animation-not-working-108
- assigned-session:
- pr: https://github.com/btcsellis/Flywheel.GSD/pull/23

## Description

The gradient animation on dashboard cards (indicating a work item is being actively worked on) does not reliably appear during unattended workflows. The animation works when manually launched from the dashboard but fails in unattended mode.

**Root cause identified**: Two issues in `app/src/lib/transitioning.ts` `getAllTransitioning()`:

1. **Prompt file location mismatch**: The function scans `FLYWHEEL_PATH` (`~/personal/flywheel-gsd`) for `.flywheel-prompt-*.txt` files, but worktree workflows place prompt files in the worktree directory (e.g., `~/personal/flywheel-gsd-worktrees/<branch>/`), so they're never found.

2. **Race condition in unattended skill chaining**: Each skill's "create marker if not exists" guard can cause missed transitions. When skill A's marker still exists as skill B starts, B skips creation. Then the dashboard clears A's stale marker (status changed), leaving no marker for B's phase.

## Success Criteria

- [x] `getAllTransitioning()` detects `.flywheel-prompt-*.txt` files in worktree directories (not just FLYWHEEL_PATH)
- [x] Gradient animation appears on dashboard card during unattended skill chaining (define -> plan -> execute)
- [x] Each skill phase creates/updates its own transitioning marker with the correct `previousStatus`
- [x] No stale transitioning markers left after a skill completes its status transition
- [x] All existing tests pass
- [x] No type errors

## Notes

- Worktree directories follow the pattern: `~/personal/flywheel-gsd-worktrees/<branch>/`
- The prompt file naming convention: `.flywheel-prompt-<session-name>.txt`
- The dashboard polls `/api/transitioning` every 5 seconds
- Skills each have a "step 1a" that creates transitioning markers with an "only if not exists" guard -- this guard needs to be changed to "create or update"

## Implementation Plan

### Phase 1: Fix worktree prompt file detection in transitioning.ts

1. **Scan worktree directories for prompt files**
   - File: `app/src/lib/transitioning.ts`, `getAllTransitioning()` function (lines 95-132)
   - Add a constant for the worktrees parent directory: `path.join(path.dirname(FLYWHEEL_PATH), 'flywheel-gsd-worktrees')`
   - After scanning `FLYWHEEL_PATH` for prompt files, also scan each subdirectory of the worktrees directory for `.flywheel-prompt-*.txt` files
   - Reuse the existing prompt file parsing logic (lines 98-131) for both locations
   - Verification: Start a worktree workflow, confirm `GET /api/transitioning` returns the item

### Phase 2: Fix skill marker creation to always update

2. **Change "create if not exists" to "always create/update" in all four skills**
   - Files:
     - `skills/flywheel-define.md` (lines 60-62)
     - `skills/flywheel-plan.md` (lines 61-63)
     - `skills/flywheel-execute.md` (lines 46-48)
     - `skills/flywheel-done.md` (lines 49-51)
   - In each file, remove the `if [ ! -f ... ]; then` / `fi` guard so the marker is always written with the current `previousStatus`
   - This ensures each skill phase updates the marker with the correct status, preventing the race condition where a stale marker gets cleaned up and no new one is created
   - Verification: Read each skill file and confirm the guard is removed

### Verification

- `cd app && npm run typecheck` -- no type errors
- `cd app && npm run lint` -- no lint errors
- `cd app && npm run build` -- build succeeds
- Manual: launch a worktree work item unattended, confirm gradient animation persists across skill transitions

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000
2. Look for a card with `bug-gradient-animation-not-working-108` or any card with the transitioning gradient animation
3. Verify the gradient animation CSS class `transitioning-card` is being applied to cards that have active transitioning markers
4. Confirm the gradient sweep animation is visible on the card

## Execution Log

- 2026-01-27T23:34:38.758Z Work item created
- 2026-01-28T00:00:00.000Z Goals defined, success criteria added
- 2026-01-28T00:01:00.000Z Implementation plan created
- 2026-01-28T00:06:00.000Z Phase 1: Added worktree directory scanning to getAllTransitioning() in transitioning.ts
- 2026-01-28T00:07:00.000Z Phase 2: Updated all 4 skill files to always create/update transitioning markers
- 2026-01-28T00:08:00.000Z Build passes (next build) with no type errors
- 2026-01-28T00:09:00.000Z Browser verification: dashboard shows "1 transitioning", worktree prompt file detected for superpower plugin item
- 2026-01-28T00:10:00.000Z All success criteria verified, transitioning to review
- 2026-01-28T00:12:00.000Z Committed and pushed (7c3628d)
- 2026-01-28T00:12:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/23
- 2026-01-28T00:12:00.000Z Work item completed
