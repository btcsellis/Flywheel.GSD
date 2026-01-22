# Add visual indicator when Claude Code is working on a status transition

## Metadata
- id: this-is-a-test-i-ll-update-the-title-lat-943
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: defined
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

- [ ] When a status action button is clicked, the work item card shows an animated gradient background
- [ ] The animated gradient is visible on both the dashboard list and detail page
- [ ] Dashboard auto-refreshes work item status periodically (e.g., every 5 seconds)
- [ ] When the work item status changes (detected via polling), the UI updates automatically
- [ ] The animation stops and card returns to normal when status transition completes
- [ ] Build passes with no type errors
- [ ] The animated gradient background also shows when a /flywheel-(status) command is used in Claude Code

## Notes

- No timeout/error handling needed for stuck states - user will handle that in Claude Code session
- The indicator stays visible until actual status change is detected
- State persistence across page reloads is nice-to-have, not required

## Execution Log

- 2026-01-22T13:22:56.848Z Work item created
- 2026-01-22T15:15:00.000Z Goals defined, success criteria added
