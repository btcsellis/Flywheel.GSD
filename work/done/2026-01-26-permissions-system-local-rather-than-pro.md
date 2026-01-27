# Permissions system local rather than project

## Metadata
- id: permissions-system-local-rather-than-pro-375
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-permissions-system-local-rather-than-pro-375
- assigned-session:

## Description

Switch the permissions system from managing `settings.json` to `settings.local.json` at both the project and area levels. This prevents Claude Code permissions from being committed and pushed to other developers via the repo. Global level (`~/.claude/`) is unaffected since it's already user-local.

Affected levels:
- **Project level**: `{project}/.claude/settings.json` → `{project}/.claude/settings.local.json`
- **Area level**: `~/.claude-{area}/settings.json` → `~/.claude-{area}/settings.local.json`

The dashboard UI stays the same — only the underlying file paths change.

## Success Criteria

- [x] `permissions.ts`: `getProjectSettingsPath()` returns `settings.local.json` instead of `settings.json`
- [x] `permissions.ts`: `getAreaSettingsPath()` returns `settings.local.json` instead of `settings.json`
- [x] All read/write functions at project and area levels operate on `settings.local.json`
- [x] `terminal.ts`: Worktree copy logic uses `settings.local.json` as the primary project-level source
- [x] Dashboard permissions page reads/writes `settings.local.json` at project and area levels (no UI changes needed)
- [x] API routes (`/api/permissions/*`) work correctly with the new paths
- [x] `.gitignore` in flywheel-gsd project includes `.claude/settings.local.json` (or `settings.local.json` pattern)
- [x] Existing `settings.json` project-level permissions are migrated to `settings.local.json` (or migration path documented)
- [x] Global-level settings (`~/.claude/settings.json`) remain unchanged
- [x] All tests pass, no type errors

## Implementation Plan

### Phase 1: Change path functions in `permissions.ts`

1. **Update `getAreaSettingsPath()`** (`app/src/lib/permissions.ts:230`)
   - Change `settings.json` → `settings.local.json`
   - Verification: function returns path ending in `settings.local.json`

2. **Update `getProjectSettingsPath()`** (`app/src/lib/permissions.ts:233`)
   - Change `settings.json` → `settings.local.json`
   - Verification: function returns path ending in `settings.local.json`

**Note:** Global path (`GLOBAL_SETTINGS_PATH` line 227) stays as `settings.json` — intentionally unchanged.

### Phase 2: Update worktree copy logic in `terminal.ts`

3. **Make `settings.local.json` the primary copied file** (`app/src/lib/terminal.ts:161-182`)
   - The `copyClaudeSettingsForWorktree` function already copies both `settings.json` and `settings.local.json`
   - No code change needed here — the function already handles `settings.local.json` (lines 184-208)
   - Since `permissions.ts` now writes to `settings.local.json`, worktree copy picks it up automatically
   - Verification: confirm worktree copy logic handles `settings.local.json`

### Phase 3: Gitignore and migration

4. **Add `.claude/settings.local.json` to `.gitignore`**
   - File: `.gitignore` (project root)
   - Add pattern: `.claude/settings.local.json`
   - Verification: `git check-ignore .claude/settings.local.json` returns match

5. **Migrate existing project-level `settings.json` to `settings.local.json`**
   - For the flywheel-gsd project: copy `.claude/settings.json` permissions to `.claude/settings.local.json`
   - Remove permission entries from `.claude/settings.json` (or document that it can be cleaned up)
   - Verification: `.claude/settings.local.json` exists with correct rules

### Phase 4: Verification

6. **API routes require no changes**
   - `/api/permissions` (GET) calls `readAreaRawRules()` and `readProjectRawRules()` which use the updated path functions
   - `/api/permissions/rule` (PUT) calls `writeAreaRule()` and `writeProjectRule()` which use the updated path functions
   - No direct path references in route files

7. **Dashboard UI requires no changes**
   - UI calls API routes, which call lib functions — no direct file path references

8. **Run typecheck and build**
   - `cd app && npx tsc --noEmit`
   - `cd app && npm run build`

### Files to Modify
- `app/src/lib/permissions.ts` — lines 230, 234 (two string changes)
- `.gitignore` — add one line

### Files Unchanged (confirm no changes needed)
- `app/src/lib/terminal.ts` — already handles both files
- `app/src/app/api/permissions/**` — uses lib functions, no direct paths
- `app/src/app/permissions/page.tsx` — UI only, calls API

## Execution Log

- 2026-01-26T16:27:31.770Z Work item created
- 2026-01-27T10:00:00.000Z Goals defined, success criteria added
- 2026-01-27T10:01:00.000Z Implementation plan created
- 2026-01-27T10:02:00.000Z Executed: updated getAreaSettingsPath and getProjectSettingsPath to use settings.local.json
- 2026-01-27T10:02:00.000Z Executed: added .claude/settings.local.json to .gitignore
- 2026-01-27T10:02:00.000Z Executed: migrated settings.json permissions to settings.local.json, cleared settings.json
- 2026-01-27T10:03:00.000Z Verified: typecheck passes, build succeeds, gitignore works
- 2026-01-27T10:03:00.000Z All success criteria verified
- 2026-01-27T10:03:00.000Z Ready for /flywheel-done
- 2026-01-27T10:04:00.000Z Committed and pushed (e9eb151)
- 2026-01-27T10:04:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/13
- 2026-01-27T10:04:00.000Z Work item completed
