# Action dropdown gets cut off for bottom card

## Metadata
- id: action-dropdown-gets-cut-off-for-bottom--736
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

On the dashboard, when clicking the status action on the bottom card, the options get cut off because they extend below the container.

The dropdown should open downward by default. If the dropdown would extend below the viewport (window bottom), it should flip and open upward instead. The container's overflow should allow the dropdown to be visible.

## Success Criteria

- [x] Dropdown opens downward by default when there's room below
- [x] Dropdown flips to open upward when it would extend below the viewport
- [x] Container overflow does not clip the dropdown menu
- [x] Works on dashboard kanban view
- [x] No type errors
- [x] Build passes

## Implementation Plan

### Phase 1: Fix Container Overflow

1. **Update dashboard container overflow**
   - File: `app/src/app/dashboard-client.tsx`
   - Change `overflow-x-auto` to allow dropdown to escape vertically
   - Use `overflow-x-auto overflow-y-visible` won't work (CSS limitation)
   - Instead: Remove overflow clipping by adding `overflow-visible` to inner containers or restructuring

### Phase 2: Add Viewport Detection to LaunchButton

2. **Add dropdown direction state**
   - File: `app/src/components/launch-button.tsx`
   - Add state: `const [openUpward, setOpenUpward] = useState(false)`
   - Use existing `menuRef` to get button position

3. **Calculate dropdown direction on menu open**
   - In `handleOpenMenu`, get button's bounding rect
   - Check if bottom of button + dropdown height (~200px) exceeds viewport height
   - If so, set `openUpward = true`

4. **Update dropdown positioning classes**
   - When `openUpward`: use `bottom-full mb-1` instead of `mt-1`
   - Keep existing horizontal alignment (`right-0` for compact)

### Verification

- Open dashboard with cards in bottom swimlane
- Click action button on bottom card
- Dropdown should open upward, fully visible
- Run `npm run build` to verify no type errors

## Execution Log

- 2026-01-22T16:13:04.450Z Work item created
- 2026-01-22T16:15:00.000Z Goals defined, success criteria added
- 2026-01-22T16:18:00.000Z Implementation plan created
- 2026-01-22T16:22:00.000Z Initial attempt with absolute positioning - still clipped by overflow
- 2026-01-22T16:25:00.000Z Verified in Chrome - dropdown still cut off due to container overflow
- 2026-01-22T16:26:00.000Z Fixed: Changed to position:fixed with calculated viewport coordinates
- 2026-01-22T16:27:00.000Z Verified in Chrome - dropdown now fully visible, escapes overflow container
- 2026-01-22T16:27:30.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-22T16:30:00.000Z Committed and pushed to main
- 2026-01-22T16:30:30.000Z Work item completed
