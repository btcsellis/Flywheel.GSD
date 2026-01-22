# Add sub-swimlanes for individual projects

## Metadata
- id: add-sub-swimlanes-for-individual-project-952
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-add-sub-swimlanes-for-individual-project-952
- assigned-session:

## Description

Add nested sub-swimlanes within each area (Bellwether, Sophia, Personal) to group work items by individual project. Currently all projects within an area are mixed together in the same swimlane.

**Behavior:**
- Area headers always show (even if empty)
- Project sub-swimlanes only appear if there are cards for that project
- Projects sorted alphabetically within each area
- Visual hierarchy: area header → project sub-swimlane → cards

## Success Criteria

- [x] Work items are grouped by project within each area swimlane
- [x] Project sub-swimlanes only render when they have at least one card
- [x] Projects are sorted alphabetically within each area
- [x] Area headers still display even when the area has no work items
- [x] Visual hierarchy clearly distinguishes areas from project sub-swimlanes
- [x] Existing functionality (card actions, navigation, blocked section) still works
- [x] No TypeScript errors
- [x] Build passes

## Notes

- Current matrix structure is `matrix[area][status]` - needs to become `matrix[area][project][status]`
- Project name available from `item.metadata.project` (format: "area/projectName")
- Styling can be iterated on after initial implementation

## Implementation Plan

### Phase 1: Restructure Data Matrix

**File**: `app/src/app/dashboard-client.tsx`

1. **Update matrix type and initialization**
   - Change matrix type from `Record<Area, Record<WorkItemStatus, WorkItem[]>>` to `Record<Area, Record<string, Record<WorkItemStatus, WorkItem[]>>>`
   - The middle key is the project name (e.g., "flywheel-gsd", "BellwetherPlatform")
   - Initialize dynamically as projects are encountered

2. **Update matrix population loop (lines 124-128)**
   - Extract project name from `item.metadata.project.split('/')[1]`
   - Create nested project object if it doesn't exist
   - Push items into `matrix[area][projectName][status]`

### Phase 2: Update Rendering Structure

**File**: `app/src/app/dashboard-client.tsx`

3. **Create helper to get sorted projects for an area**
   - Extract unique project names from `matrix[area]`
   - Sort alphabetically
   - Filter to only projects with at least one item

4. **Update swimlane rendering (lines 181-240)**
   - Keep area header row (simplified - just the label, no cells)
   - Add nested loop for each project within the area
   - Project sub-swimlane: smaller label + cells for each status
   - Apply visual hierarchy:
     - Area header: full-width, larger text, accent bar
     - Project row: indented label, smaller text, muted accent

5. **Update item count calculations**
   - Area total: sum across all projects and statuses
   - Project total: sum across all statuses for that project

### Phase 3: Styling Adjustments

6. **Visual hierarchy for project sub-swimlanes**
   - Indented or smaller label column for projects
   - Lighter/muted version of area accent color
   - Slightly smaller font size
   - No left accent bar (reserve for area headers)

7. **Handle empty areas gracefully**
   - Area header still shows even with 0 items
   - No project sub-swimlanes rendered (since none have cards)
   - Display "0 items" count

### Verification

- [ ] Run `npm run build` in app/ directory - should complete without errors
- [ ] Run `npm run dev` and visually verify:
  - Projects are grouped within areas
  - Only projects with cards show sub-swimlanes
  - Projects sorted alphabetically
  - Area headers always visible
  - Cards still clickable/navigable
  - Launch buttons still work
  - Blocked section still works

## Execution Log

- 2026-01-22T16:15:39.457Z Work item created
- 2026-01-22T16:20:00.000Z Goals defined, success criteria added
- 2026-01-22T16:25:00.000Z Implementation plan created
- 2026-01-22T16:30:00.000Z Phase 1: Restructured data matrix to area→project→status
- 2026-01-22T16:32:00.000Z Phase 2: Updated rendering with area headers and project sub-swimlanes
- 2026-01-22T16:33:00.000Z Phase 3: Applied visual hierarchy styling
- 2026-01-22T16:34:00.000Z Build passed, all success criteria verified
- 2026-01-22T16:34:30.000Z Ready for /flywheel-done
- 2026-01-22T16:40:00.000Z Committed and pushed
- 2026-01-22T16:40:30.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/4
- 2026-01-22T16:41:00.000Z Work item completed
