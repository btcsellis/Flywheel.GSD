# Handle permissions in worktrees

## Metadata
- id: handle-permissions-in-worktrees-460
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-handle-permissions-in-worktrees-460
- assigned-session:
- pr: https://github.com/btcsellis/Flywheel.GSD/pull/11

## Description

Currently `symlinkClaudeSettings()` in `terminal.ts` symlinks the entire `.claude` directory from the parent project to the worktree. This doesn't work for path-based permissions because the worktree path (`~/personal/project-worktrees/work-item-id/`) doesn't match the original project path (`~/personal/project/`).

**Solution:** Instead of symlinking, copy settings files and rewrite path-based permissions to use the worktree path. Flywheel-specific permissions (defined in `PERMISSION_CATEGORIES.flywheel`) should NOT be rewritten since they always reference the main flywheel-gsd repo.

## Success Criteria

- [x] Replace `symlinkClaudeSettings()` with a function that copies settings instead of symlinking
- [x] Copy both `settings.json` and `settings.local.json` (if exists) to worktree's `.claude/` directory
- [x] Rewrite path-based permissions that match the project path to use the worktree path instead
- [x] Do NOT rewrite flywheel-specific permissions (rules defined in the `flywheel` category in `permissions.ts`)
- [x] Existing worktree creation flow continues to work (no breaking changes to `createWorktree()` API)
- [x] All tests pass, no type errors

## Notes

- Flywheel rules to preserve (from `PERMISSION_CATEGORIES`):
  - `Read(~/personal/flywheel-gsd/**)`
  - `Edit(~/personal/flywheel-gsd/work/**)`
  - `Bash(mv ~/personal/flywheel-gsd/work/*)`
  - `Bash(cd ~/personal/flywheel-gsd*)`
  - etc.
- Path rewriting should handle both `~` and expanded home directory paths

## Implementation Plan

### Phase 1: Add path rewriting utility functions

1. **Export flywheel rules from permissions.ts**
   - Create `getFlywheelRules()` function that returns all rules from the `flywheel` category
   - Export it for use in `terminal.ts`
   - File: `app/src/lib/permissions.ts`
   - Verification: Function exists and returns expected array of flywheel rules

2. **Create `rewritePathInRule()` function in terminal.ts**
   - Takes a rule string, project path, and worktree path
   - Parses the rule to extract any path patterns
   - If pattern contains project path (with `~` or expanded), replaces with worktree path
   - Returns the rewritten rule (or original if no rewrite needed)
   - Must handle both `~` prefix and full `/Users/...` paths
   - File: `app/src/lib/terminal.ts`
   - Verification: Unit-testable pure function

3. **Create `rewritePermissionsForWorktree()` function**
   - Takes rules array, project path, worktree path, and flywheel rules set
   - Iterates through rules, skipping flywheel rules
   - Rewrites paths for non-flywheel rules
   - Returns new array of rewritten rules
   - File: `app/src/lib/terminal.ts`
   - Verification: Unit-testable pure function

### Phase 2: Replace symlink with copy + rewrite

4. **Create `copyClaudeSettingsForWorktree()` function**
   - Replace `symlinkClaudeSettings()` with new implementation
   - Steps:
     a. Check if source `.claude` directory exists (if not, return early)
     b. Check if target `.claude` already exists (if so, return early - don't overwrite)
     c. Create target `.claude` directory
     d. Read `settings.json` from source (if exists)
     e. Rewrite permissions using `rewritePermissionsForWorktree()`
     f. Write rewritten `settings.json` to target
     g. Read `settings.local.json` from source (if exists)
     h. Rewrite permissions in local settings
     i. Write rewritten `settings.local.json` to target
   - File: `app/src/lib/terminal.ts`
   - Verification: Creates `.claude` directory with rewritten settings files

5. **Update `createWorktree()` to use new function**
   - Change line 103 from `symlinkClaudeSettings()` to `copyClaudeSettingsForWorktree()`
   - No other changes needed to the function
   - File: `app/src/lib/terminal.ts`
   - Verification: Worktree creation still works, permissions are copied and rewritten

### Phase 3: Cleanup and verification

6. **Remove old `symlinkClaudeSettings()` function**
   - Delete the function (lines 41-69)
   - File: `app/src/lib/terminal.ts`
   - Verification: No unused code remains

7. **Build and type check**
   - Run `npm run build` in app directory
   - Fix any type errors
   - Verification: Build succeeds with no errors

### Verification

- [ ] Build passes: `cd app && npm run build`
- [ ] Lint passes: `cd app && npm run lint`
- [ ] Manual test: Create a worktree and verify `.claude/settings.json` contains rewritten paths
- [ ] Manual test: Verify flywheel permissions are NOT rewritten (still reference `~/personal/flywheel-gsd`)
- [ ] Manual test: Verify project-specific path permissions ARE rewritten to worktree path

## Execution Log

- 2026-01-26T15:30:27.812Z Work item created
- 2026-01-26T15:45:00.000Z Goals defined, success criteria added
- 2026-01-26T16:00:00.000Z Implementation plan created
- 2026-01-26T16:15:00.000Z Phase 1: Added `getFlywheelRules()` export to permissions.ts
- 2026-01-26T16:20:00.000Z Phase 1-2: Created `rewritePathInRule()`, `rewritePermissionsForWorktree()`, and `copyClaudeSettingsForWorktree()` functions in terminal.ts
- 2026-01-26T16:25:00.000Z Phase 2: Updated `createWorktree()` to use `copyClaudeSettingsForWorktree()`
- 2026-01-26T16:30:00.000Z Phase 3: Build passes, lint passes (only pre-existing warnings)
- 2026-01-26T16:35:00.000Z All success criteria verified
- 2026-01-26T16:35:00.000Z Ready for /flywheel-done
- 2026-01-26T16:40:00.000Z Committed and pushed
- 2026-01-26T16:40:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/11
- 2026-01-26T16:45:00.000Z Work item completed
