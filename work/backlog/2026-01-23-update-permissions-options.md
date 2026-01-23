# Update permissions options

## Metadata
- id: update-permissions-options-188
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: defined
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

- [ ] Blanket `"Read"` permission removed from `~/.claude/settings.json`
- [ ] Blanket `"Write"` permission removed from `~/.claude/settings.json`
- [ ] Project-path-scoped Edit permission added (e.g., `Edit(./**)` or similar pattern that works)
- [ ] Existing Read permissions for flywheel-gsd and .claude paths remain intact
- [ ] Claude Code can still read/edit files in the current project after changes
- [ ] Claude Code cannot edit files outside the project path



## Notes

**Permission syntax reference:**
- `Read` - blanket read all files
- `Read(path/**)` - read files under path
- `Edit(path/**)` - edit files under path
- `./**` may work for "current project" but need to verify

**Key insight:** The flywheel permissions should handle flywheel/claude paths. This change focuses on removing the dangerous blanket permissions and adding project-scoped edit.

## Execution Log

- 2026-01-23T22:06:14.891Z Work item created
- 2026-01-23T22:10:00.000Z Goals defined, success criteria added
