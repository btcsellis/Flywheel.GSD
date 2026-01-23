# Update permissions options

## Metadata
- id: update-permissions-options-188
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

In flywheel managed permissions, remove the blanket `Read` and `Write` permissions and replace with path-specific permissions:

**Current state:**
- `~/.claude/settings.json` has blanket `"Read"` and `"Write"` on lines 4-5
- These allow reading/writing any file on the system

**Desired state:**
- Remove blanket `Read` and `Write`
- Keep existing specific Read permissions (flywheel-gsd, .claude paths)
- Add `Edit` permission scoped to current project path only
- Read can remain broader for flywheel/claude-relevant paths

## Success Criteria

- [x] Blanket `"Read"` permission removed from `~/.claude/settings.json`
- [x] Blanket `"Write"` permission removed from `~/.claude/settings.json`
- [x] Project-path-scoped Edit permission added (e.g., `Edit(./**)` or similar pattern that works)
- [x] Existing Read permissions for flywheel-gsd and .claude paths remain intact
- [x] Claude Code can still read/edit files in the current project after changes
- [x] Claude Code cannot edit files outside the project path



## Notes

**Permission syntax reference (from official docs):**
- `Read` - blanket read all files
- `Read(./**)` - read files under current project directory
- `Edit(./**)` - edit files under current project directory
- `~` expands to home directory
- `.` means current project directory
- `**` is recursive glob pattern

**Key insight:** The flywheel permissions should handle flywheel/claude paths. This change focuses on removing the dangerous blanket permissions and adding project-scoped edit.

## Implementation Plan

### Phase 1: Remove Blanket Permissions

1. **Remove blanket Read permission**
   - File: `~/.claude/settings.json`
   - Remove `"Read"` from line 4 of permissions.allow array
   - Verification: `grep -n '"Read"' ~/.claude/settings.json` should not match a standalone "Read"

2. **Remove blanket Write permission**
   - File: `~/.claude/settings.json`
   - Remove `"Write"` from line 5 of permissions.allow array
   - Verification: `grep -n '"Write"' ~/.claude/settings.json` should return no matches

### Phase 2: Add Project-Scoped Permissions

3. **Add project-scoped Read permission**
   - File: `~/.claude/settings.json`
   - Add `"Read(./**)"` to permissions.allow array
   - This allows reading any file in the current project directory
   - Verification: Permission appears in file

4. **Add project-scoped Edit permission**
   - File: `~/.claude/settings.json`
   - Add `"Edit(./**)"` to permissions.allow array
   - This allows editing any file in the current project directory
   - Verification: Permission appears in file

### Phase 3: Verify Existing Permissions Intact

5. **Verify flywheel-gsd Read permissions remain**
   - Check that `"Read(~/personal/flywheel-gsd/**)"` still exists
   - Check that `"Edit(~/personal/flywheel-gsd/work/**)"` still exists
   - Verification: grep for these patterns

6. **Verify .claude Read permissions remain**
   - Check that `"Read(~/.claude/**)"` still exists
   - Check that `"Read(.claude/**)"` still exists
   - Verification: grep for these patterns

### Verification

- `cat ~/.claude/settings.json | jq '.permissions.allow'` shows no blanket Read/Write
- Project-scoped `Read(./**)` and `Edit(./**)` are present
- Flywheel-specific permissions are intact
- Test: Claude Code can read/edit files in current project
- Test: Claude Code prompts for permission to edit files outside project

## Execution Log

- 2026-01-23T22:06:14.891Z Work item created
- 2026-01-23T22:10:00.000Z Goals defined, success criteria added
- 2026-01-23T22:15:00.000Z Implementation plan created
- 2026-01-23T22:20:00.000Z Transitioned to executing
- 2026-01-23T22:21:00.000Z Replaced blanket Read/Write with Read(./**) and Edit(./**)
- 2026-01-23T22:22:00.000Z All verifications passed
- 2026-01-23T22:22:00.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-23T22:25:00.000Z Work item completed (shipped to main)
