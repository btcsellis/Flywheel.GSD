# Don't ask which session

## Metadata
- id: don-t-ask-which-session-846
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-don-t-ask-which-session-846
- assigned-session:

## Description

When advancing a work item using the orange button, don't ask whether to use an existing session or start a new session. If an existing session is there with the right tmux session name, then use it. otherwise start a new one.

## Success Criteria

- [x] Orange "advance" button no longer shows session selection modal
- [x] Automatically detects existing tmux session matching pattern `flywheel-{project}-{workItemId}`
- [x] If matching session exists, uses it directly without prompting
- [x] If no matching session exists, creates a new one automatically
- [x] If multiple matching sessions exist, picks first one found
- [x] Shows error message if session creation fails
- [x] All existing tests pass
- [x] No type errors

## Notes

- Only affects the advance status button, not other buttons
- Exact match on tmux session name required (no fuzzy matching)
- No UI feedback needed when auto-selecting - user sees result in iTerm2

## Implementation Plan

### Overview

The current flow shows a session selection modal asking "New session" vs "Existing session". This plan removes that modal and auto-detects existing tmux sessions.

**Key files:**
- `app/src/app/api/launch-claude/route.ts` - API endpoint (add auto-detection logic)
- `app/src/lib/terminal.ts` - Terminal utilities (already has `tmuxSessionExists()`)
- `app/src/components/launch-button.tsx` - LaunchButton component (remove session dropdown)
- `app/src/app/item/[folder]/[filename]/work-item-detail.tsx` - Detail page (remove session dropdown)

### Phase 1: Backend Auto-Detection

1. **Modify `launch-claude/route.ts` API endpoint**
   - Remove reliance on `reuseSession` query parameter for decision-making
   - Add logic to auto-detect: call `tmuxSessionExists(tmuxSessionName)` before launching
   - If session exists → set `reuseSession: true` automatically
   - If session doesn't exist → set `reuseSession: false` automatically
   - Keep error handling for failed session creation
   - Verification: API correctly auto-detects sessions without client input

### Phase 2: Frontend Simplification

2. **Modify `launch-button.tsx` component**
   - Remove the session selection menu items ("New session" / "Existing session")
   - When workflow is already set, directly call launch without showing session dropdown
   - Keep workflow selection (main vs worktree) for new items - that's a separate concern
   - Verification: Clicking advance button with workflow set calls API directly

3. **Modify `work-item-detail.tsx` component**
   - Remove session selection dropdown from the inline advance button
   - Same behavior: if workflow set, launch directly; if not, show workflow selection only
   - Verification: Detail page advance button works without session prompt

### Phase 3: Error Handling

4. **Add error feedback for session creation failures**
   - In `launch-button.tsx` and `work-item-detail.tsx`, show toast/alert on launch failure
   - Error message should be user-friendly (e.g., "Failed to create terminal session")
   - Verification: Simulate failure, verify error displays

### Verification

- Run `npm run typecheck` in app directory
- Run `npm run lint` in app directory
- Run `npm run build` in app directory
- Manual test: Click advance on work item with existing tmux session → should reuse it
- Manual test: Click advance on work item without tmux session → should create new one

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000
2. Find a work item card with the orange advance button
3. Click the orange button
4. Verify NO session selection dropdown appears (only workflow selection if needed)
5. Verify the launch proceeds automatically

## Execution Log

- 2026-01-23T21:19:46.314Z Work item created
- 2026-01-23T21:20:30.000Z Goals defined, success criteria added
- 2026-01-23T21:22:00.000Z Implementation plan created
- 2026-01-23T21:49:00.000Z Phase 1: Backend auto-detection implemented (terminal.ts, route.ts)
- 2026-01-23T21:50:00.000Z Phase 2: Frontend session dropdown removed (launch-button.tsx, work-item-detail.tsx)
- 2026-01-23T21:51:00.000Z Build passed, lint passed (warnings only)
- 2026-01-23T21:58:00.000Z Browser verification: Session dropdown removed, workflow selection only shown for new items
- 2026-01-23T21:59:00.000Z All success criteria verified
- 2026-01-23T21:59:00.000Z Ready for /flywheel-done
- 2026-01-23T22:05:00.000Z Committed and pushed
- 2026-01-23T22:05:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/6
- 2026-01-23T22:05:00.000Z Work item completed
