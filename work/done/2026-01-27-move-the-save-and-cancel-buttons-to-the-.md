# Move the save and cancel buttons to the top of the page

## Metadata
- id: move-the-save-and-cancel-buttons-to-the--197
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-move-the-save-and-cancel-buttons-to-the--197
- assigned-session:

## Description

when editing a work item, the buttons often scroll off the bottom of the page, and I'd rather not have to scroll to save. Let's more them to the top. We may as well match the design on teh new item page, too.

## Success Criteria

- [x] Edit work item page (`work-item-detail.tsx`): Save and Cancel inline with title; Delete at bottom
- [x] New work item page (`new/page.tsx`): Create and Cancel inline with title
- [x] Both pages use a consistent button layout/design (same styling, ordering, spacing)
- [x] Buttons remain visible without scrolling when editing long work items
- [x] All existing tests pass
- [x] No type errors

## Implementation Plan

### Phase 1: Move buttons in work-item-detail.tsx

1. **Move the Actions div from bottom to top of the form content**
   - File: `app/src/app/item/[folder]/[filename]/work-item-detail.tsx`
   - Cut lines 926–950 (the `{/* Actions */}` div with Save, Cancel, Delete buttons)
   - Paste them immediately after the page header / before the Workflow Info section (~line 693), so they appear at the top of the form fields area
   - Change border styling from `pt-4 border-t` to `pb-4 border-b` so the separator is below the buttons instead of above

### Phase 2: Move buttons in new/page.tsx

2. **Move the Actions div from bottom to top of the form content**
   - File: `app/src/app/new/page.tsx`
   - Cut lines 516–531 (the `{/* Actions */}` div with Create and Cancel buttons)
   - Paste them at the top of the form content area (after any page heading, before the first form field)
   - Change border styling from `pt-4 border-t` to `pb-4 border-b`

### Verification

- Run `npm run build` in the app directory to confirm no type errors
- Run any existing tests
- Visual check via browser

## Browser Verification

**Prerequisites:**
- Dev server running at http://localhost:3000

**Steps:**
1. Navigate to http://localhost:3000
2. Click on any work item to open the edit page
3. Verify Save, Cancel, and Delete buttons are visible at the top of the form without scrolling
4. Navigate to http://localhost:3000/new
5. Verify Create Work Item and Cancel buttons are visible at the top of the form without scrolling
6. Confirm button styling is consistent between both pages

## Execution Log

- 2026-01-27T23:30:03.240Z Work item created
- 2026-01-27T23:30:30.000Z Goals defined, success criteria added
- 2026-01-27T23:31:00.000Z Implementation plan created
- 2026-01-27T23:35:00.000Z Committed and pushed
- 2026-01-27T23:35:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/21
- 2026-01-27T23:35:00.000Z Work item completed
