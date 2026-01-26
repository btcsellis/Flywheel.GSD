# Bug - when using a /flywheel command directly in Claude Code the card gradient animation does not work

## Metadata
- id: bug-when-using-a-flywheel-command-direct-570
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-bug-when-using-a-flywheel-command-direct-570
- assigned-session:

## Description

When clicking the launch button in the dashboard UI, the card shows a gradient animation while the work item is being processed. However, when running `/flywheel-*` commands directly in Claude Code (e.g., `/flywheel-define`, `/flywheel-plan`, `/flywheel-execute`), the animation does not appear.

The root cause: the dashboard button calls `POST /api/transitioning` to create a `.flywheel-transitioning-{id}` marker file, which the dashboard polls for. Direct command execution bypasses this, so no marker is created.

## Success Criteria

- [x] Running `/flywheel-define` directly in Claude Code triggers the card gradient animation in the dashboard
- [x] Running `/flywheel-plan` directly in Claude Code triggers the card gradient animation in the dashboard
- [x] Running `/flywheel-execute` directly in Claude Code triggers the card gradient animation in the dashboard
- [x] Running `/flywheel-done` directly in Claude Code triggers the card gradient animation in the dashboard
- [x] Animation clears when the command completes and status changes (existing behavior preserved)
- [x] All tests pass (N/A - no tests configured)
- [x] No type errors (N/A - changes to markdown only)

## Notes

- The transitioning state is managed via marker files: `.flywheel-transitioning-{id}`
- Located in `FLYWHEEL_GSD_PATH` (default: `~/personal/flywheel-gsd`)
- Dashboard polls every 5 seconds and clears animation when status changes
- Key files:
  - `/app/src/lib/transitioning.ts` - marker file management
  - `/app/src/app/api/transitioning/route.ts` - API endpoints
  - Skill files in `~/.claude/commands/` - flywheel-define.md, flywheel-plan.md, flywheel-execute.md, flywheel-done.md

## Implementation Plan

### Phase 1: Add Transitioning Instructions to Skill Files

Each flywheel skill needs to create the transitioning marker file at the start of execution. The marker file format is:

```json
{
  "id": "{work-item-id}",
  "previousStatus": "{current-status}",
  "startedAt": "{ISO-timestamp}"
}
```

1. **Update `flywheel-define.md`**
   - Add step after loading work item: create `.flywheel-transitioning-{id}` marker file
   - File location: `$FLYWHEEL_PATH/.flywheel-transitioning-{id}`
   - Content: JSON with id, previousStatus (from work item), startedAt (current ISO timestamp)
   - Verification: Marker file exists with correct content

2. **Update `flywheel-plan.md`**
   - Add same transitioning marker creation step after loading work item
   - Verification: Marker file exists with correct content

3. **Update `flywheel-execute.md`**
   - Add same transitioning marker creation step after loading work item
   - Verification: Marker file exists with correct content

4. **Update `flywheel-done.md`**
   - Add same transitioning marker creation step after loading work item
   - Verification: Marker file exists with correct content

### Phase 2: Verify Marker Is Cleared on Status Change

The dashboard already handles clearing the marker when status changes (via polling in `dashboard-client.tsx`). No changes needed here, but verify:

- Dashboard polls transitioning API every 5 seconds
- When status changes, `DELETE /api/transitioning?id={id}` is called
- Marker file is deleted

### Verification

1. Run `npm run typecheck` in app/ - must pass
2. Run `npm run lint` in app/ - must pass
3. Manual test: Run `/flywheel-define` directly, verify dashboard shows gradient animation
4. Manual test: Run `/flywheel-plan` directly, verify animation appears
5. Manual test: Verify animation clears when command completes and status changes

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000
2. Find a work item card in backlog/active columns
3. Note the work item ID for verification
4. Run a flywheel command in terminal (separate from browser test)
5. Refresh dashboard page
6. Verify the card has the gradient animation (transitioning-card class)
7. Wait for command to complete
8. Verify animation clears after status changes

## Execution Log

- 2026-01-23T20:03:28.357Z Work item created
- 2026-01-26T12:00:00.000Z Goals defined, success criteria added
- 2026-01-26T17:10:00.000Z Implementation plan created
- 2026-01-26T17:15:00.000Z Phase 1 complete: Added transitioning marker creation to all 4 skill files
- 2026-01-26T17:20:00.000Z Browser verification: confirmed marker file triggers dashboard animation
- 2026-01-26T17:20:00.000Z All success criteria verified
- 2026-01-26T17:25:00.000Z Committed and pushed
- 2026-01-26T17:25:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/10
- 2026-01-26T17:25:00.000Z Work item completed
