# Remove Executing column

## Metadata
- id: remove-executing-column-636
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

When I do /flywheel-execute or click the button to move the status past planned, there is no reason to park the item in an executing column. It can just have the gradient animation while the execution is happening, and when it's done, it goes into the review column.

The `executing` status should be removed entirely. Items remain as `planned` during execution (with the existing gradient animation to indicate active work), then transition directly to `review` when complete.

## Success Criteria

- [x] "Executing" column removed from the Kanban board UI
- [x] `executing` removed from valid status values in the codebase
- [x] Items stay in "Planned" column during execution (with gradient animation)
- [x] Items transition directly from `planned` → `review` when execution completes
- [x] Work item template updated to remove `executing` from status options
- [x] CLAUDE.md documentation updated to remove `executing` from workflow steps
- [x] All existing tests pass
- [x] No TypeScript errors

## Notes

- The gradient animation for "in progress" items already exists - no new animation work needed
- This simplifies the workflow from 7 statuses to 6: new → defined → planned → review → done (+ blocked)

## Implementation Plan

### Phase 1: Update Type Definitions and Constants

1. **Remove `executing` from WorkItemStatus type**
   - File: `app/src/lib/work-items.ts` (lines 6-13)
   - Remove `'executing'` from the union type
   - Remove the `case 'executing': return 'bg-purple-500';` color mapping (line 349)

2. **Update status transition mappings**
   - File: `app/src/lib/prompts.ts` (lines 14-22)
   - Change `planned` targetStatus from `'executing'` to `'review'`
   - Remove the `'executing'` entry entirely
   - Update `blocked` targetStatus from `'executing'` to `'planned'`

### Phase 2: Update Dashboard UI

3. **Remove "Executing" column from Kanban board**
   - File: `app/src/app/dashboard-client.tsx`
   - Remove `{ status: 'executing', label: 'Executing', num: '04' }` from `WORKFLOW_STEPS` (line 21)
   - Renumber subsequent columns (review becomes 04, done becomes 05)
   - Remove `executing: []` from `emptyStatusRecord()` (line 126)
   - Remove executing count from stats display (line 180)

4. **Move progress bar to show on `planned` items during execution**
   - File: `app/src/app/dashboard-client.tsx` (lines 380, 462-478)
   - Change condition from `status === 'executing'` to checking if item is transitioning or has progress
   - Show progress bar for `planned` items that have completion progress

### Phase 3: Update Work Item Detail Page

5. **Remove "Executing" from workflow stepper**
   - File: `app/src/app/item/[folder]/[filename]/work-item-detail.tsx`
   - Remove `{ status: 'executing', label: 'Executing', num: '4' }` from `WORKFLOW_STEPS` (line 21)
   - Renumber subsequent steps

### Phase 4: Update Documentation

6. **Update CLAUDE.md workflow documentation**
   - File: `CLAUDE.md`
   - Remove `executing` from status options in template (line 39)
   - Update workflow steps to show: new → defined → planned → review → done (lines 67+)

7. **Update work item template**
   - File: `work/TEMPLATE.md`
   - Ensure `executing` is not listed as a valid status option

### Phase 5: Handle Existing Work Items

8. **Migrate any items currently in `executing` status**
   - Check for items with `status: executing` in `work/active/`
   - Change them to `status: planned` (they'll show the gradient animation when actively being worked on)

### Verification

- Run `npm run build` to check for TypeScript errors
- Run `npm run lint` to check for linting issues
- Verify dashboard loads without errors
- Verify work items can transition: new → defined → planned → review → done

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000
2. Verify Kanban board shows 5 columns: New, Defined, Planned, Review, Done (no Executing column)
3. Verify column numbers are correct: 01, 02, 03, 04, 05
4. Navigate to a work item detail page
5. Verify workflow stepper shows 5 steps without "Executing"
6. If a work item is transitioning, verify gradient animation displays on the card

## Execution Log

- 2026-01-23T14:37:44.312Z Work item created
- 2026-01-23 Goals defined, success criteria added
- 2026-01-23 Implementation plan created
- 2026-01-23 Removed `executing` from WorkItemStatus type in work-items.ts
- 2026-01-23 Updated STATUS_ACTIONS in prompts.ts: planned→review, removed executing entry
- 2026-01-23 Updated WORKFLOW_STEPS in dashboard-client.tsx (5 columns, renumbered)
- 2026-01-23 Updated progress bar to show for planned items being executed
- 2026-01-23 Updated WORKFLOW_STEPS in work-item-detail.tsx (5 steps, renumbered)
- 2026-01-23 Updated CLAUDE.md documentation
- 2026-01-23 Migrated existing item (linting-issues) from executing→planned
- 2026-01-23 Build passed, lint passed (no errors)
- 2026-01-23 Browser verification: Kanban shows 5 columns, detail page shows 5 steps
- 2026-01-23 All success criteria verified, ready for review
- 2026-01-23 Fixed: Removed Done column from Kanban board (items archive when done, not displayed)
- 2026-01-23 Committed and pushed to main (2861499)
- 2026-01-23 Work item completed
