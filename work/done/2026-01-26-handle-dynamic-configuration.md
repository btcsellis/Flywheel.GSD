# Handle dynamic configuration

## Metadata
- id: handle-dynamic-configuration-125
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-handle-dynamic-configuration-125
- assigned-session:

## Description

The user has area-specific Claude configurations managed via direnv:
- `~/personal/.envrc` → sets `CLAUDE_CONFIG_DIR=~/.claude-personal`
- `~/bellwether/.envrc` → sets `CLAUDE_CONFIG_DIR=~/.claude-bellwether`
- `~/sophia/.envrc` → sets `CLAUDE_CONFIG_DIR=~/.claude-sophia`

When flywheel starts sessions in worktrees (e.g., `~/personal/project-worktrees/item-123/`), direnv should inherit correctly since worktrees are under the area directory.

The permission dashboard currently only manages `~/.claude/settings.json` (one "Global" column). It needs to manage all 4 config directories so permissions can be configured per-area.

## Success Criteria

- [x] Permission dashboard shows 4 "global" columns instead of 1:
  - `~/.claude` (default/fallback)
  - `~/.claude-personal`
  - `~/.claude-bellwether`
  - `~/.claude-sophia`
- [x] Each area column allows toggling permission categories independently
- [x] Verify flywheel sessions in worktrees correctly inherit `CLAUDE_CONFIG_DIR` from direnv (may already work - verify)
- [x] All tests pass
- [x] No TypeScript errors

## Implementation Plan

### Phase 1: Extend Permissions Library

1. **Add area-specific global config paths to `permissions.ts`**
   - Define `AREA_CONFIG_DIRS` mapping: `{ bellwether: '~/.claude-bellwether', sophia: '~/.claude-sophia', personal: '~/.claude-personal' }`
   - Add alongside existing `GLOBAL_SETTINGS_PATH` (which stays as `~/.claude`)
   - Files: `app/src/lib/permissions.ts`
   - Verification: TypeScript compiles without errors

2. **Create area-specific read/write functions**
   - Add `readAreaRawRules(area: string): Promise<string[]>`
   - Add `writeAreaRule(area: string, rule: string, enabled: boolean): Promise<void>`
   - Pattern after existing `readGlobalRawRules` and `writeGlobalRule`
   - Files: `app/src/lib/permissions.ts`
   - Verification: Functions exist and handle missing config dirs gracefully

### Phase 2: Extend API Routes

3. **Update GET `/api/permissions` response to include area globals**
   - Modify `UnifiedPermissionsResponse` interface to add `areaGlobals: Record<string, string[]>`
   - Call `readAreaRawRules` for each area
   - Files: `app/src/app/api/permissions/route.ts`
   - Verification: API returns area-specific global rules

4. **Update PUT `/api/permissions/rule` to handle area scope**
   - Accept scope values like `global:bellwether`, `global:sophia`, `global:personal`, `global` (default)
   - Route to `writeAreaRule` or `writeGlobalRule` accordingly
   - Files: `app/src/app/api/permissions/rule/route.ts`
   - Verification: Can toggle rules for specific areas via API

### Phase 3: Update Dashboard UI

5. **Modify permissions page to show 4 global columns**
   - Add column headers: "Global", "Personal", "Bellwether", "Sophia"
   - Each with subtext showing config path (e.g., `~/.claude-personal`)
   - Update state interface to track `areaGlobals: Record<string, string[]>`
   - Files: `app/src/app/permissions/page.tsx`
   - Verification: 4 global columns visible in UI

6. **Implement area global toggles**
   - Add `toggleAreaRule(area: string, rule: string, enabled: boolean)` callback
   - Wire up checkboxes for each area column
   - Show disabled state for project rules when parent area global is enabled
   - Files: `app/src/app/permissions/page.tsx`
   - Verification: Can click checkboxes in area columns, changes persist

### Phase 4: Verification

7. **Verify direnv inheritance in worktrees**
   - Create test worktree in `~/personal/`
   - Check that `CLAUDE_CONFIG_DIR` env var is set correctly when entering worktree
   - Document finding in execution log
   - Verification: `cd ~/personal/some-project-worktrees/test && echo $CLAUDE_CONFIG_DIR` shows `~/.claude-personal`

8. **Run tests and type check**
   - `npm run build` to verify no TypeScript errors
   - Manual test: toggle rules in each area column, verify they persist in correct files
   - Files: N/A
   - Verification: Build succeeds, manual testing passes

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify 4 global columns are visible: "Global", "Personal", "Bellwether", "Sophia"
3. Verify each column shows the config path (e.g., `~/.claude-personal`)
4. Toggle a rule in the "Personal" area column (not already enabled globally)
5. Verify checkbox changes state and saves
6. Refresh page and verify the rule is still enabled for Personal
7. Verify project columns still work correctly

## Execution Log

- 2026-01-26T14:52:49.843Z Work item created
- 2026-01-26T15:18:00.000Z Goals defined: extend permission dashboard to manage 4 area-specific config directories
- 2026-01-26T15:30:00.000Z Implementation plan created
- 2026-01-26T15:45:00.000Z Phase 1 complete: Added AREA_CONFIG_DIRS and area read/write functions to permissions.ts
- 2026-01-26T15:50:00.000Z Phase 2 complete: Updated API routes to support area:personal/bellwether/sophia scopes
- 2026-01-26T15:55:00.000Z Phase 3 complete: Updated permissions page with 4 global columns and toggleAreaRule
- 2026-01-26T16:00:00.000Z Browser verification passed: 4 columns visible, toggles work, changes persist
- 2026-01-26T16:02:00.000Z Verified direnv: CLAUDE_CONFIG_DIR=/Users/stevenellis/.claude-personal in worktree
- 2026-01-26T16:03:00.000Z All success criteria verified
- 2026-01-26T16:03:00.000Z Ready for /flywheel-done
- 2026-01-26T16:10:00.000Z Committed and pushed to origin
- 2026-01-26T16:10:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/12
- 2026-01-26T16:10:00.000Z Work item completed
