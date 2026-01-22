# Add visual indicator when Claude Code is working on a status transition

## Metadata
- id: this-is-a-test-i-ll-update-the-title-lat-943
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session: 

## Description

When the user clicks a status action button (e.g., "Define", "Plan", "Execute") that launches Claude Code, the dashboard should show a visual indicator that work is in progress. This helps the user know that something is happening even though the actual work is in a separate terminal/tmux session. The same thing should happen if the user uses a claude skill to go to the next status.

**Visual indicator**: Animated gradient background on the work item card
**Scope**: Both dashboard list view and detail page stepper
**Auto-refresh**: Dashboard polls the work item file periodically to detect when status changes, then updates the UI automatically
**Persistence**: Nice to have if not too complex - indicator shows even after page reload

## Success Criteria

- [x] When a status action button is clicked, the work item card shows an animated gradient background
- [x] The animated gradient is visible on both the dashboard list and detail page
- [x] Dashboard auto-refreshes work item status periodically (e.g., every 5 seconds)
- [x] When the work item status changes (detected via polling), the UI updates automatically
- [x] The animation stops and card returns to normal when status transition completes
- [x] Build passes with no type errors
- [x] The animated gradient background also shows when a /flywheel-(status) command is used in Claude Code

## Notes

- No timeout/error handling needed for stuck states - user will handle that in Claude Code session
- The indicator stays visible until actual status change is detected
- State persistence across page reloads is nice-to-have, not required

## Implementation Plan

### Phase 1: State Management & API

1. **Create API route for polling work items**
   - Add `GET /api/work-items` route that returns all work items with their current status
   - Returns `{ backlog: WorkItem[], active: WorkItem[] }` from `getAllWorkItems()`
   - Enables client-side polling without full page reload
   - Files: `src/app/api/work-items/route.ts`
   - Verification: `curl localhost:3000/api/work-items` returns JSON

2. **Create transitioning state tracking**
   - Add marker file approach: when LaunchButton launches Claude, create `.flywheel-transitioning-{id}` file
   - File contains: `{ id, previousStatus, startedAt }`
   - Delete the file when status changes or manually cleared
   - Files: `src/lib/transitioning.ts` (new), `src/app/api/transitioning/route.ts` (new)
   - Verification: Files created/deleted correctly

### Phase 2: Animated Gradient CSS

3. **Add animated gradient keyframes to globals.css**
   - Define `@keyframes gradient-shift` animation
   - Create `.animate-gradient-shift` class with subtle moving gradient
   - Use area accent colors (blue, orange, green) as base
   - Smooth, non-distracting animation (~3s cycle)
   - Files: `src/app/globals.css`
   - Verification: Class can be applied and animates

### Phase 3: Dashboard Integration

4. **Convert dashboard to client component with polling**
   - Create `src/app/dashboard-client.tsx` client component wrapper
   - Move KanbanCard and board rendering into client component
   - Server component passes initial data, client handles updates
   - Add `useEffect` with 5-second polling interval for work items
   - Track transitioning items in client state
   - Files: `src/app/page.tsx`, `src/app/dashboard-client.tsx` (new)
   - Verification: Dashboard renders, data loads from API

5. **Update KanbanCard with gradient animation**
   - Add `isTransitioning` prop to KanbanCard
   - When `isTransitioning=true`, apply animated gradient background
   - Gradient uses the card's accent color as base
   - Animation stops when status changes (detected via polling)
   - Files: `src/app/dashboard-client.tsx`
   - Verification: Card shows animation when transitioning

6. **Update LaunchButton to trigger transitioning state**
   - After successful launch, call `POST /api/transitioning` to mark item
   - Pass work item ID to parent via callback
   - Dashboard adds item to transitioning set
   - Files: `src/components/launch-button.tsx`, `src/app/dashboard-client.tsx`
   - Verification: Clicking launch shows gradient animation

### Phase 4: Detail Page Integration

7. **Add transitioning state to detail page**
   - Create client wrapper for detail page stepper section
   - Poll for work item status changes
   - Show gradient animation on current step when transitioning
   - Files: `src/app/item/[folder]/[filename]/work-item-detail.tsx`
   - Verification: Detail page shows animation during transitions

### Phase 5: Skill-triggered transitions

8. **Support /flywheel-* skill triggers**
   - Skills write `.flywheel-transitioning-{id}` file when they start
   - Dashboard polling detects this file and shows animation
   - File deleted when skill completes (status changes)
   - Files: Skills already update status in work item files; just need to detect
   - Verification: Running `/flywheel-plan` shows animation on dashboard

### Verification

- `npm run build` succeeds with no errors
- Dashboard shows animated gradient when LaunchButton clicked
- Detail page shows animated gradient during transitions
- Polling detects status changes and stops animation
- Gradient uses correct accent color per area
- Animation is smooth and non-distracting

## Execution Log

- 2026-01-22T13:22:56.848Z Work item created
- 2026-01-22T15:15:00.000Z Goals defined, success criteria added
- 2026-01-22T16:10:00.000Z Implementation plan created
- 2026-01-22T16:15:00.000Z Created GET /api/work-items route for polling
- 2026-01-22T16:17:00.000Z Created transitioning state tracking (lib + API)
- 2026-01-22T16:19:00.000Z Added animated gradient CSS keyframes
- 2026-01-22T16:25:00.000Z Converted dashboard to client component with polling
- 2026-01-22T16:27:00.000Z Updated KanbanCard with gradient animation
- 2026-01-22T16:29:00.000Z Updated LaunchButton to trigger transitioning state
- 2026-01-22T16:32:00.000Z Added transitioning state to detail page stepper
- 2026-01-22T16:35:00.000Z Added prompt file detection for skill-triggered transitions
- 2026-01-22T16:36:00.000Z Build verified, all success criteria met
- 2026-01-22T16:36:30.000Z Ready for /flywheel-done
- 2026-01-22T16:38:00.000Z Committed and pushed to main (da9399a)
- 2026-01-22T16:38:30.000Z Work item completed
