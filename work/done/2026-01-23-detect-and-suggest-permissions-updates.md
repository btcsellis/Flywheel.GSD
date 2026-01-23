# Detect and suggest permissions updates

## Metadata
- id: detect-and-suggest-permissions-updates-428
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Two related problems with Claude Code permissions:

**Problem A: Repeated permission prompts**
When working in flywheel, the same permissions get requested repeatedly across sessions. After `/flywheel-done`, detect any permissions that were granted during the session and suggest adding them to the flywheel-gsd permission system.

**Problem B: Worktree path mismatch**
When "always allow" is selected in a worktree, permissions get stored with the worktree path (e.g., `/path/to/worktrees/feature-branch/`). When the worktree is cleaned up or you're back in the main project, those permissions don't apply because the path is different.

**Solution approach:**
1. In `/flywheel-done`, detect worktree permissions with worktree-specific paths
2. Offer to migrate them to the main project path
3. Suggest adding frequently-used permissions to flywheel-gsd's permission sets

## Success Criteria

- [x] `/flywheel-done` detects `.claude/settings.json` in worktree workflows
- [x] If worktree settings exist, compare with main project settings
- [x] Permissions with worktree-specific paths are identified
- [x] User is prompted to migrate worktree permissions to main project (approve/skip)
- [x] If approved, permissions are copied to main project's `.claude/settings.json` with corrected paths
- [x] Suggest adding common permissions to flywheel-gsd permission rules (optional enhancement)

## Notes

**Worktree path issue example:**
```json
// In worktree: /Users/steve/worktrees/feature-123/.claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(npm run build:/Users/steve/worktrees/feature-123)"
    ]
  }
}

// Should become (in main project):
{
  "permissions": {
    "allow": [
      "Bash(npm run build:/Users/steve/projects/myapp)"
    ]
  }
}
```

**Detection approach:**
- Check if `.claude/settings.json` exists in current directory (worktree)
- Compare with main project's `.claude/settings.json`
- Look for paths containing the worktree directory

## Implementation Plan

### Phase 1: Add Permissions Migration to Worktree Cleanup

1. **Add new section to flywheel-done.md for permissions migration**
   - File: `~/.claude/commands/flywheel-done.md`
   - Insert new section "### 8a. Migrate Worktree Permissions" after step 8's worktree path capture but BEFORE worktree deletion
   - This must run while the worktree still exists
   - Verification: Read file and confirm section exists

2. **Implement permissions detection logic**
   - Check if `$WORKTREE_PATH/.claude/settings.json` exists
   - If not, skip this section (no permissions to migrate)
   - If yes, read and parse the permissions
   - Verification: Logic documented in skill file

3. **Implement path replacement logic**
   - For each permission in worktree settings:
     - Check if it contains `$WORKTREE_PATH`
     - Replace with `$MAIN_PROJECT` path
   - Verification: Logic documented in skill file

4. **Implement merge prompt**
   - Show user the permissions that would be migrated
   - Present options: approve / skip
   - If approved, merge into main project's `.claude/settings.json`
   - Verification: Logic documented in skill file

### Phase 2: Handle Edge Cases

5. **Handle missing main project settings**
   - If `$MAIN_PROJECT/.claude/settings.json` doesn't exist, create it
   - Initialize with empty permissions structure
   - Verification: Logic handles this case

6. **Handle duplicate permissions**
   - When merging, check for duplicates
   - Don't add permissions that already exist in main project
   - Verification: Logic handles this case

### Phase 3: Optional Enhancement - Suggest Flywheel Permission Rules

7. **Detect common permission patterns** (optional)
   - After migration, analyze permissions for patterns
   - Suggest adding to flywheel-gsd global permission rules if frequently used
   - This is informational only - suggest but don't auto-modify
   - Verification: User sees suggestions when applicable

### Verification

- In a worktree workflow, permissions from worktree are offered for migration
- Path replacement works correctly (worktree path → main project path)
- User can approve or skip migration
- Approved permissions appear in main project's `.claude/settings.json`
- Duplicates are not added

## Execution Log

- 2026-01-23T21:11:02.358Z Work item created
- 2026-01-23T21:50:00.000Z Goals defined, success criteria added
- 2026-01-23T21:55:00.000Z Implementation plan created
- 2026-01-23T22:00:00.000Z Transitioned to executing, moved to active/
- 2026-01-23T22:02:00.000Z Added "Migrate Worktree Permissions" section to flywheel-done.md
- 2026-01-23T22:03:00.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-23T21:45:00.000Z Work item completed (shipped to main)
