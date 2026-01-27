# Move the save and cancel buttons to the top of the page

## Metadata
- id: move-the-save-and-cancel-buttons-to-the--197
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: planned
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-move-the-save-and-cancel-buttons-to-the--197
- assigned-session:

## Description

when editing a work item, the buttons often scroll off the bottom of the page, and I'd rather not have to scroll to save. Let's more them to the top. We may as well match the design on teh new item page, too.

## Success Criteria

- [ ] Edit work item page (`work-item-detail.tsx`): Save, Cancel, and Delete buttons are at the top of the form, not the bottom
- [ ] New work item page (`new/page.tsx`): Create and Cancel buttons are at the top of the form, not the bottom
- [ ] Both pages use a consistent button layout/design (same styling, ordering, spacing)
- [ ] Buttons remain visible without scrolling when editing long work items
- [ ] All existing tests pass
- [ ] No type errors

## Execution Log

- 2026-01-27T23:30:03.240Z Work item created
- 2026-01-27T23:30:30.000Z Goals defined, success criteria added
