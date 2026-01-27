# Area permissions are overriding global permissions

## Metadata
- id: permissions-are-not-working-in-worktrees-275
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-permissions-are-not-working-in-worktrees-275
- assigned-session: 

## Description

Each area (`~/personal/`, `~/bellwether/`, `~/sophia/`) sets `CLAUDE_CONFIG_DIR` via direnv to `~/.claude-{area}`, which completely replaces `~/.claude/` as Claude Code's config directory. When flywheel's permissions dashboard writes a "global" permission to `~/.claude/settings.local.json`, it's never read by sessions running in any area.

**Fix**: When writing a global permission, write the rule to all 4 locations (`~/.claude/` + 3 area dirs). The dashboard should also highlight any global permissions that are missing from an area's settings (drift detection).

## Success Criteria

- [x] `writeGlobalRule()` and `writeGlobalPermissions()` in `permissions.ts` write to all 4 settings files (`~/.claude/settings.local.json`, `~/.claude-personal/settings.local.json`, `~/.claude-bellwether/settings.local.json`, `~/.claude-sophia/settings.local.json`)
- [x] When removing a global permission, it is removed from all 4 locations
- [x] Dashboard highlights global permissions that are missing from any area (drift detection)
- [x] Area-specific permissions remain independent — toggling an area permission only writes to that area's file
- [x] Existing area-specific permissions are preserved when writing global rules (no overwriting)
- [x] All tests pass, no type errors

## Notes

### Root Cause
`CLAUDE_CONFIG_DIR` replaces `~/.claude/` entirely. Area `.envrc` files set this for each area. The area `settings.local.json` files don't inherit from global. So global permissions written to `~/.claude/settings.local.json` are invisible in area sessions.

### Area Config Directories
- `~/.claude/` — true global (only used when no `CLAUDE_CONFIG_DIR` set)
- `~/.claude-personal/` — personal area
- `~/.claude-bellwether/` — bellwether area
- `~/.claude-sophia/` — sophia area

## Implementation Plan

### Phase 1: Add area constants and helper

1. **Add `AREA_VALUES` constant to `permissions.ts`**
   - Add `const AREA_VALUES = ['personal', 'bellwether', 'sophia'] as const;` near the top of the file
   - This is the single source of truth for area names
   - Export it for use in the dashboard

2. **Add `getAllSettingsLocalPaths()` helper**
   - Returns array of all 4 `settings.local.json` paths: global + 3 areas
   - Uses existing `GLOBAL_SETTINGS_PATH` and `getAreaSettingsPath()`

### Phase 2: Update global write functions

3. **Update `writeGlobalRule()` in `permissions.ts` (line 578)**
   - After writing to `GLOBAL_SETTINGS_PATH`, also call `writeAreaRule()` for each area in `AREA_VALUES`
   - This adds/removes the rule from all 4 files
   - Area files preserve their existing rules — only the specific rule is added/removed

4. **Update `writeGlobalPermissions()` in `permissions.ts` (line 358)**
   - After writing category-based rules to global, compute the rules list and ensure each area file also has them
   - For each area: read existing area rules, add any missing global rules, remove any global rules being disabled
   - Preserve area-specific rules that aren't part of the global set

### Phase 3: Drift detection in dashboard

5. **Add `getGlobalDrift()` function to `permissions.ts`**
   - Read global rules from `~/.claude/settings.local.json`
   - Read each area's rules
   - Return a map of `{ [area]: string[] }` where value is global rules missing from that area
   - Export for use in API and dashboard

6. **Add drift API endpoint**
   - Create `app/src/app/api/permissions/drift/route.ts` with GET handler
   - Calls `getGlobalDrift()` and returns the result
   - OR: include drift data in the existing `GET /api/permissions` response

7. **Show drift indicators in dashboard**
   - In `permissions/page.tsx`, after loading permissions data, check for drift
   - For each area column, if a global rule is enabled but missing from that area, show a visual indicator (e.g. yellow/orange highlight or warning icon on the cell)
   - Add a "Sync all" action that writes missing global rules to all areas

### Phase 4: Update flywheel-permissions skill

8. **Update `skills/flywheel-permissions.md`**
   - When scope is "Global", the skill should note that rules will be written to all 4 locations
   - Update step 7 description to reflect multi-file write behavior
   - No code change needed — the skill calls `writeGlobalRule()` indirectly through the settings file, or writes directly. If it writes directly to `~/.claude/settings.local.json`, update it to also write to area files.

### Phase 5: Verification

9. **Run typecheck**
   - `cd app && npm run typecheck` (or `npx tsc --noEmit`)
   - Fix any type errors

10. **Manual verification**
    - Toggle a global rule in the dashboard
    - Verify the rule appears in all 4 `settings.local.json` files
    - Verify area-specific rules are not affected

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify the permissions table loads with Global, Area, and Project columns
3. Toggle a global rule OFF that is currently ON
4. Verify the toggle updates in the UI
5. Check that drift indicators appear for areas missing that rule (if applicable)
6. Toggle the global rule back ON
7. Verify no drift indicators remain

## Execution Log

- 2026-01-27T20:02:20.958Z Work item created
- 2026-01-27 Root cause investigated and documented
- 2026-01-27 Goals redefined: write global permissions to all 4 locations + drift detection
- 2026-01-27 Implementation plan created
- 2026-01-27 Execution: added AREA_VALUES constant and updated writeGlobalRule/writeGlobalPermissions to write to all 4 locations
- 2026-01-27 Execution: added getGlobalDrift() and syncGlobalToAreas() functions
- 2026-01-27 Execution: added /api/permissions/sync endpoint and drift data in /api/permissions response
- 2026-01-27 Execution: added drift banner with Sync All button and per-cell amber indicators in dashboard
- 2026-01-27 Execution: fixed race condition in syncGlobalToAreas (batched writes per area file)
- 2026-01-27 Execution: updated flywheel-permissions skill docs for multi-location writes
- 2026-01-27 Verification: typecheck passes, all API tests pass, browser verification confirms drift UI works
- 2026-01-27 All success criteria verified, ready for /flywheel-done
- 2026-01-27 Committed and pushed (c767542)
- 2026-01-27 PR created: https://github.com/btcsellis/Flywheel.GSD/pull/17
- 2026-01-27 Work item completed
