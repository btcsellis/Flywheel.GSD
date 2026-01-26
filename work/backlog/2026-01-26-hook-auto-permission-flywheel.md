# Hook: Permission Collection and Management

## Metadata
- id: hook-auto-permission-flywheel-802
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: new
- assigned-session:

## Description

Implement a system to collect permission requests and provide a way to add them to the permission management system (`.claude/settings.json`) with user approval.

**Problem:** Permission prompts slow down flywheel workflows. Currently, adding permissions to `settings.json` is manual - you have to remember what was requested and type out the permission string.

**Solution:**
1. Hook logs all permission requests to a file
2. A command/skill reviews collected permissions and offers to add them to settings.json

**Hook type:** `PermissionRequest` (for logging)

**Workflow:**
1. `PermissionRequest` hook logs each request to a file (e.g., `~/.claude/permission-requests.log`)
2. After a session (or on demand), run a command like `/flywheel-permissions`
3. Command shows collected permission requests
4. User selects which to add to `.claude/settings.json` or `.claude/settings.local.json`
5. Selected permissions are added to the allow list

**Example flow:**
```
$ /flywheel-permissions

Collected permission requests since last review:

1. Bash(git add work/*)
2. Bash(git commit -m *)
3. Edit(/Users/.../work/active/*.md)
4. Bash(npm run build)

Select permissions to add (comma-separated, or 'all'): 1,2,3

Added to .claude/settings.local.json:
- Bash(git add work/*)
- Bash(git commit -m *)
- Edit(/Users/.../work/active/*.md)
```

## Success Criteria

- [ ] Hook script logs permission requests to a file
- [ ] Hook configuration added to `.claude/settings.json`
- [ ] Command/skill to review collected permissions
- [ ] User can select which permissions to add
- [ ] Selected permissions added to settings.json or settings.local.json
- [ ] Duplicate permissions are detected and skipped
- [ ] Log is cleared after permissions are reviewed/added

## Notes

This is about building up the permission allow-list over time with user control, not auto-allowing at runtime.

Consider: Should this be a flywheel skill (`/flywheel-permissions`) or a standalone tool?

## Execution Log

- 2026-01-26T14:00:00Z Work item created
- 2026-01-26T14:05:00Z Updated approach: collect and manage permissions, not auto-allow
