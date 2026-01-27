# Make unattended flag visible on board

## Metadata
- id: make-unattended-flag-visible-on-board-622
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: review
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-make-unattended-flag-visible-on-board-622
- assigned-session: 

## Description

If an item is set to unattended, show a visual indicator on the kanban board cards. The `unattended` metadata field already exists in the data model and is editable on the detail page, but the `KanbanCard` component doesn't display it. Add a badge or indicator alongside the existing workflow badge in the card's meta row.

## Success Criteria

- [x] KanbanCard in `dashboard-client.tsx` shows a visual indicator when `unattended` is true
- [x] Indicator follows existing badge styling patterns (similar to workflow badge)
- [x] Indicator is not shown when `unattended` is false or undefined
- [x] All tests pass
- [x] No type errors

## Implementation Plan

### Phase 1: Add unattended badge to KanbanCard

1. **Add unattended badge in meta row**
   - File: `app/src/app/dashboard-client.tsx`
   - In the `KanbanCard` component, after the workflow badge (lines 439-447), add a conditional badge when `item.metadata.unattended` is true
   - Use the same pattern as the workflow badge: `<span>` with `text-[10px] uppercase px-1.5 py-0.5 rounded` classes
   - Color: green scheme (`bg-green-500/20 text-green-400`) to differentiate from workflow badges (blue/purple)
   - Label text: "auto" (short, fits the small badge)

### Verification

- Run `npm run build` in `app/` to confirm no type errors
- Run any existing tests
- Visual check on dashboard

## Browser Verification

**Prerequisites:**
- Dev server running at http://localhost:3000

**Steps:**
1. Navigate to http://localhost:3000
2. Find a card that has `unattended: true` — the current work item itself should appear
3. Verify a green "auto" badge is visible on that card
4. Verify cards without unattended flag do NOT show the badge

## Notes

- KanbanCard already renders workflow badges in a meta row (lines ~431-460 of `dashboard-client.tsx`)
- The `unattended` field is already in the `WorkItemMetadata` interface in `work-items.ts`
- Archive cards are out of scope for this item

## Execution Log

- 2026-01-27T20:59:36.403Z Work item created
- 2026-01-27T21:00:00.000Z Goals defined, success criteria added
- 2026-01-27T21:01:00.000Z Implementation plan created
- 2026-01-27T21:02:00.000Z Added green "auto" badge to KanbanCard meta row
- 2026-01-27T21:03:00.000Z TypeScript check passed (no errors)
- 2026-01-27T21:03:30.000Z Browser verification: "Text is hard to read" card shows AUTO badge; cards without unattended flag do not
- 2026-01-27T21:04:00.000Z All success criteria verified
- 2026-01-27T21:04:00.000Z Ready for /flywheel-done
