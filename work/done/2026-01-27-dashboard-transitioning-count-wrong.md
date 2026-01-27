# Dashboard transitioning count wrong

## Metadata
- id: dashboard-transitioning-count-wrong-321
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-dashboard-transitioning-count-wrong-321
- assigned-session:

## Description

The dashboard transitioning count was showing 5 when only 1 item was actually transitioning. Root cause: stale `.flywheel-transitioning-*` marker files accumulate when sessions crash or complete without cleanup. Additionally, the dedup logic in `getAllTransitioning()` between prompt files and marker files is broken — the ID extracted from a prompt file's work item filename (e.g. `worktree-test-port`) won't match the actual work item ID that includes a numeric suffix (e.g. `worktree-test-port-664`), so duplicates can slip through.

**Key files:**
- `app/src/lib/transitioning.ts` — `getAllTransitioning()` reads markers + prompt files
- `app/src/app/dashboard-client.tsx` — polls API, auto-clears on status change
- `app/src/app/api/transitioning/route.ts` — API endpoints

## Success Criteria

- [x] `getAllTransitioning()` validates each marker against its work item: if the work item doesn't exist, the marker is automatically cleaned up
- [x] `getAllTransitioning()` validates consistency: if the work item's current status differs from the marker's `previousStatus`, the marker is cleaned up
- [x] Prompt file dedup uses the actual work item ID from the markdown metadata (reading the `id:` field) rather than deriving it from the filename
- [x] No type errors (`npm run typecheck`)
- [x] No lint errors (`npm run lint`)
- [x] Dashboard shows correct transitioning count after fix

## Implementation Plan

### Phase 1: Fix `getAllTransitioning()` in `app/src/lib/transitioning.ts`

Only one file needs modification: `app/src/lib/transitioning.ts`.

1. **Import `getAllWorkItems` from `work-items.ts`**
   - Add import at top of file
   - This gives access to all work items for validation

2. **Add marker validation against work items**
   - After collecting marker file states (lines 64-72), load all work items via `getAllWorkItems()`
   - For each marker state, check if a work item with matching `id` exists in backlog, active, or done
   - If no matching work item exists → delete the marker file, skip adding to `states`
   - If work item exists but its current `status` matches the marker's `previousStatus` (meaning no transition happened yet) → keep it (it's legitimately transitioning)
   - If work item exists and its `status` differs from `previousStatus` → delete the marker file, skip adding to `states` (transition completed, stale marker)

3. **Fix prompt file dedup logic**
   - Lines 80-97: Instead of deriving the ID from the filename with `workItemFilename.replace(/^\d{4}-\d{2}-\d{2}-/, '')`, read the actual work item file referenced in the prompt and extract the `id:` field from its metadata
   - Use regex `content.match(/Work item file:\s*(.+\.md)/)` to get the full file path
   - Read that file and extract `id` with `/^- id:\s*(.+)$/m`
   - Use the extracted ID for dedup against existing `states`

### Verification

- `cd app && npm run typecheck` — no type errors
- `cd app && npm run lint` — no lint errors
- Check dashboard shows correct count

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000

**Steps:**
1. Navigate to http://localhost:3000
2. Verify the stats bar transitioning count matches the actual number of legitimately transitioning items
3. Verify cards with transitioning markers show gradient animation
4. Verify cards without markers do not show gradient animation

## Notes

- The auto-cleanup in `dashboard-client.tsx` (lines 69-80) only works when the dashboard is open and polling. Server-side cleanup in `getAllTransitioning()` would be more robust.
- The prompt file is at the flywheel-gsd root, not in worktree dirs, so there's only one prompt file source.

## Execution Log

- 2026-01-27T13:48:52.380Z Work item created
- 2026-01-27T14:56:00.000Z Goals defined, success criteria added
- 2026-01-27T15:00:00.000Z Implementation plan created
- 2026-01-27T15:01:00.000Z Implemented marker validation and prompt file dedup fix in transitioning.ts
- 2026-01-27T15:01:30.000Z TypeScript and lint checks pass
- 2026-01-27T15:02:00.000Z Browser verification: dashboard shows "1 transitioning" (correct), stale markers cleaned up
- 2026-01-27T15:02:00.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-27T15:03:00.000Z Committed and pushed
- 2026-01-27T15:03:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/14
- 2026-01-27T15:03:00.000Z Work item completed
