# Revamp permissions dashboard

## Metadata
- id: revamp-permissions-dashboard-443
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-revamp-permissions-dashboard-443
- assigned-session:

## Description

Consolidate the permissions dashboard from three separate sections (global permissions grid, project permissions table by category, and raw rules list) into a single unified table.

**Current state:**
- Global permissions shown as a checkbox grid at the top (by category)
- Project permissions shown as a table (rows=categories, columns=projects)
- "All Permission Rules" collapsible section showing raw rules

**Target state:**
- Single table with granular permission rules as rows
- Columns: Global (leftmost) | Projects (grouped by area)
- Each individual rule is a row (e.g., `Bash(git status)`, `Bash(git log:*)` as separate rows)
- When global is enabled for a rule, all project checkboxes in that row appear checked but disabled
- Custom rules detected from settings files are shown and editable like predefined rules
- No category grouping in this iteration (will be added back later as collapsible row groups)

## Success Criteria

- [x] Single unified table replaces separate global/project sections
- [x] Rows are individual permission rules (granular), not categories (~70+ rows)
- [x] Columns: Global (leftmost), then projects grouped by area
- [x] Global column checkbox enables rule for all projects
- [x] When global is enabled for a rule, project checkboxes show as checked but disabled
- [x] Custom/detected rules (not in predefined categories) appear in the table and are editable
- [x] Rules display shows tool name and pattern clearly (e.g., "Bash(git status)")
- [x] Category concept removed from UI (will be re-added later as row groupings)
- [x] Backend API supports individual rule toggles (not just category-based)
- [x] All existing functionality preserved (save to settings files, project discovery)
- [x] No type errors (`npm run typecheck`)
- [x] No lint errors (`npm run lint`)

## Notes

- Categories will be re-added later as collapsible row groups - out of scope for this work item
- The current ~70 rules come from the 13 predefined categories, plus any custom rules detected in settings files
- Settings file format remains the same (`permissions.allow` array of rule strings)

## Implementation Plan

### Phase 1: Backend API Changes

1. **Create new rule-based API endpoint**
   - File: `app/src/app/api/permissions/rule/route.ts`
   - New PUT endpoint that toggles individual rules (not categories)
   - Parameters: `{ rule: string, scope: 'global' | string (project path), enabled: boolean }`
   - Reads existing settings, adds/removes the single rule from `permissions.allow`, writes back
   - Verification: API returns 200 with updated rule state

2. **Update lib/permissions.ts**
   - Add `getAllKnownRules()` function that returns all rules from all categories
   - Add `readGlobalRawRules()` to get raw rule strings (not categories)
   - Add `readProjectRawRules(projectPath)` to get raw rule strings
   - Add `writeGlobalRule(rule, enabled)` to toggle single rule
   - Add `writeProjectRule(projectPath, rule, enabled)` to toggle single rule
   - Verification: Functions correctly read/write individual rules

3. **Create unified permissions API response**
   - Modify `app/src/app/api/permissions/route.ts` or create new endpoint
   - Return structure: `{ rules: string[], globalEnabled: string[], projects: { path, name, area, enabledRules: string[] }[] }`
   - Include both predefined rules AND custom rules detected from settings files
   - Verification: API returns complete rule list with per-scope enabled status

### Phase 2: Frontend State Refactor

4. **Update TypeScript interfaces in page.tsx**
   - Remove category-based interfaces
   - Add `RuleRow` interface: `{ rule: string, tool: string, pattern: string | null }`
   - Add `UnifiedPermissionsState`: `{ allRules: RuleRow[], globalEnabled: Set<string>, projects: ProjectState[] }`
   - Verification: TypeScript compiles without errors

5. **Update data fetching in page.tsx**
   - Fetch new unified API endpoint
   - Build `allRules` list from predefined categories + detected custom rules
   - Store enabled rules as Sets for O(1) lookup
   - Verification: Console log shows correct data structure

### Phase 3: UI Components

6. **Update Checkbox component**
   - Add visual styling for "disabled but checked" state (checked + grayed out)
   - When `disabled && checked`, show checkmark with reduced opacity/different color
   - Verification: Visual inspection shows correct disabled-checked appearance

7. **Build unified table component**
   - Remove global permissions grid section
   - Remove category-based project table
   - Create single table with:
     - Header row: "Rule" | "Global" | [projects grouped by area]
     - Body rows: one row per rule showing tool + pattern
     - Global column with checkbox
     - Project columns with checkboxes (disabled when global enabled)
   - Verification: Table renders with correct structure

8. **Implement row rendering logic**
   - For each rule row:
     - Display rule name (tool + pattern formatted nicely)
     - Global checkbox: toggles rule in global settings
     - Project checkboxes: if global enabled → show checked + disabled; else → editable
   - Verification: Clicking global checkbox disables project checkboxes in that row

### Phase 4: API Integration

9. **Wire up checkbox handlers**
   - `toggleGlobalRule(rule)`: PUT to /api/permissions/rule with scope='global'
   - `toggleProjectRule(projectPath, rule)`: PUT to /api/permissions/rule with scope=projectPath
   - Optimistic updates with rollback on error
   - Verification: Clicking checkboxes saves to correct settings files

10. **Handle custom rules**
    - Custom rules from settings files appear in table
    - Same toggle behavior as predefined rules
    - Verification: Custom rules can be toggled on/off

### Phase 5: Cleanup

11. **Remove old UI code**
    - Delete global permissions grid JSX
    - Delete category-based table JSX
    - Delete collapsible "All Permission Rules" section
    - Clean up unused interfaces, constants (PERMISSION_CATEGORIES from page.tsx)
    - Verification: Page renders only the new unified table

12. **Final verification**
    - Run `npm run typecheck` - no errors
    - Run `npm run lint` - no errors
    - Manual test: toggle rules, verify settings files update correctly
    - Verify global-enabled rules show as disabled in project columns

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify single unified table is visible (no separate global grid)
3. Verify table has columns: Rule | Global | [project names]
4. Verify rows are individual rules (~70+ rows), not categories
5. Click a Global checkbox to enable a rule
6. Verify the corresponding project checkboxes in that row become checked and disabled (grayed out)
7. Uncheck the Global checkbox
8. Verify project checkboxes become editable again
9. Toggle a project-specific rule and verify it persists on page refresh

## Execution Log

- 2026-01-26T15:25:00.056Z Work item created
- 2026-01-26T15:35:00Z Goals defined, success criteria added
- 2026-01-26T15:45:00Z Implementation plan created
- 2026-01-26T15:50:00Z Starting execution (Chrome plugin unavailable - will verify at end)
- 2026-01-26T15:55:00Z Phase 1 complete: Backend API changes
  - Created /api/permissions/rule endpoint for individual rule toggles
  - Added rule-based functions to lib/permissions.ts
  - Updated /api/permissions to return unified response
- 2026-01-26T16:00:00Z Phase 2-4 complete: Frontend rewrite
  - Rewrote page.tsx with unified table
  - Checkbox component updated with disabled-checked state
  - Wired up API handlers with optimistic updates
- 2026-01-26T16:05:00Z Phase 5 complete: Cleanup
  - Removed unused rules-list component
  - TypeScript check passes
  - Lint check passes (0 errors, 5 pre-existing warnings)
  - Build passes
- 2026-01-26T16:10:00Z All success criteria verified (code review)
- 2026-01-26T16:15:00Z Browser verification complete (Chrome plugin connected)
  - Verified unified table with 77 rules
  - Tested global checkbox toggle → project checkboxes disabled
  - Tested unchecking global → project checkboxes editable
  - All browser verification steps pass
- 2026-01-26T16:15:00Z Ready for /flywheel-done
- 2026-01-26T16:20:00Z Committed and pushed (328f91f)
- 2026-01-26T16:20:00Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/8
- 2026-01-26T16:20:00Z Work item completed
