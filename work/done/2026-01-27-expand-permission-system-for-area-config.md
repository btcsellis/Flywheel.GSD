# Expand permission system for area configs

## Metadata
- id: expand-permission-system-for-area-config-637
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

In addition to ~/.claude, I have ~/.claude-personal, ~/.claude-bellwether, and ~/.claude-sophia. Each contains a settings.json with the same structure as ~/.claude/settings.json. The permission management UI needs area-level columns between global and project columns, with a three-tier inheritance cascade: Global → Area → Project. Enabling a rule at an area level disables toggles for all projects in that area, just like global disables all columns.

## Success Criteria

- [x] Area settings are read from ~/.claude-personal/settings.json, ~/.claude-bellwether/settings.json, and ~/.claude-sophia/settings.json
- [x] Area settings are writable (toggling a rule in an area column persists to that area's settings.json)
- [x] Area columns appear in the UI between the Global column and that area's project columns (Global | Personal area | personal projects... | Bellwether area | bellwether projects... | Sophia area | sophia projects...)
- [x] Area columns use the same color coding as their project group (green for personal, blue for bellwether, orange for sophia)
- [x] Enabling a rule at the area level disables toggles for all project columns in that area (same behavior as global disabling all columns)
- [x] Three-tier cascade works correctly: Global disables area + project toggles; Area disables its project toggles; Project is leaf level
- [x] Existing global and project permission functionality is unchanged
- [x] No type errors
- [x] App builds successfully (`npm run build` in app/)

## Implementation Plan

### Phase 1: Backend — Area settings read/write in `permissions.ts`

1. **Add area settings path helper**
   - File: `app/src/lib/permissions.ts`
   - Add `getAreaSettingsPath(areaValue: string)` that returns `~/.claude-{area}/settings.json` (e.g. `~/.claude-personal/settings.json`)
   - Map area values from `AREAS` in `projects.ts`

2. **Add area read/write functions**
   - File: `app/src/lib/permissions.ts`
   - `readAreaRawRules(areaValue: string): Promise<string[]>` — reads from `~/.claude-{area}/settings.json`
   - `writeAreaRule(areaValue: string, rule: string, enabled: boolean): Promise<void>` — toggles a rule in area settings (same pattern as `writeGlobalRule`/`writeProjectRule`)

### Phase 2: Backend — API changes

3. **Extend GET `/api/permissions` response**
   - File: `app/src/app/api/permissions/route.ts`
   - Add `areaEnabled: Record<string, string[]>` to the response (keyed by area value, value is array of enabled rules)
   - For each area in `AREAS`, call `readAreaRawRules(area.value)` and include result
   - Also add any custom area rules to the `knownRules` set
   - Update `UnifiedPermissionsResponse` interface to include `areaEnabled`

4. **Extend PUT `/api/permissions/rule` to handle area scope**
   - File: `app/src/app/api/permissions/rule/route.ts`
   - Accept scope format `area:{areaValue}` (e.g. `area:personal`)
   - When scope starts with `area:`, call `writeAreaRule` instead of `writeGlobalRule`/`writeProjectRule`

### Phase 3: Frontend — UI changes in `permissions/page.tsx`

5. **Add area state to `UnifiedPermissionsState`**
   - File: `app/src/app/permissions/page.tsx`
   - Add `areaEnabled: Record<string, string[]>` to `UnifiedPermissionsState` interface
   - Create `areaEnabledSets: Record<string, Set<string>>` from the data for fast lookup

6. **Add `toggleAreaRule` callback**
   - Same pattern as `toggleGlobalRule` — optimistic update, API call to `/api/permissions/rule` with scope `area:{areaValue}`, rollback on error

7. **Add area columns to table header**
   - In the `<thead>`, for each area group, insert an area column header BEFORE the project columns for that area
   - Header shows area label (e.g. "Personal"), sub-label shows `~/.claude-personal`
   - Uses area color from `AREA_COLORS`

8. **Add area cells to table body**
   - For each rule row, insert an area cell before that area's project cells
   - Checkbox reads from `areaEnabledSets[area]`
   - On toggle, calls `toggleAreaRule(areaValue, rule, checked)`
   - **Disabled when global is enabled** (same as project cells currently)

9. **Update project cell disabled logic for three-tier cascade**
   - Project cells are disabled when `isGlobalEnabled || isAreaEnabled`
   - `disabledChecked` is true when either global or area has the rule enabled

### Phase 4: Verification

10. **Build check**
    - Run `npm run build` in `app/` — must pass with no type errors

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify area columns appear between Global and project columns for each area group
3. Verify area column headers show area name with correct color coding
4. Toggle a rule in an area column — verify checkbox updates
5. Verify that enabling a rule at area level disables project checkboxes in that area (shows disabled-checked state)
6. Verify global still disables both area and project toggles
7. Verify toggling area rule off re-enables project toggles

## Execution Log

- 2026-01-27T13:43:49.400Z Work item created
- 2026-01-27T14:00:00.000Z Goals defined, success criteria added
- 2026-01-27T14:15:00.000Z Implementation plan created
- 2026-01-27T14:30:00.000Z Phase 1-3 implemented: area read/write, API changes, UI columns with cascade
- 2026-01-27T14:30:00.000Z npm run build passes
- 2026-01-27T14:30:00.000Z Browser verification complete: area columns visible, cascade working, toggle on/off verified
- 2026-01-27T14:30:00.000Z All success criteria verified
- 2026-01-27T14:30:00.000Z Ready for /flywheel-done
