# Make action button the same height as the card

## Metadata
- id: make-action-button-the-same-height-as-th-619
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

The orange arrow button (LaunchButton) on the dashboard Kanban cards should stretch to match the full height of its adjacent work item card, regardless of card content height.

## Success Criteria

- [x] The orange action button visually matches the height of the work item card it's next to
- [x] Works correctly for cards of varying heights (single-line vs multi-line titles, with/without progress bar)
- [x] Build passes with no type errors

## Execution Log

- 2026-01-22T16:14:13.518Z Work item created
- 2026-01-22T16:45:00.000Z Goals defined, success criteria added
- 2026-01-22T16:46:00.000Z Fixed by adding items-stretch to flex container and changing Link to flex
- 2026-01-22T16:46:30.000Z Work item completed
