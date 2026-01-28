# Add permissions from permissions log

## Metadata
- id: add-permissions-from-permissions-log-539
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: defined
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-add-permissions-from-permissions-log-539
- assigned-session: 

## Description

On the permissions dashboard, add a section to show items from the permissions log (`~/personal/flywheel-gsd/permissions/permission-requests.jsonl`) and allow users to turn them into new permission rules.

**Key behaviors:**
- Display all log entries on the permissions page with ability to dismiss/remove entries
- Allow creating rules from log entries at project, area, or global scope
- Smart default scope selection based on where the request originated
- Scope selector to override the default
- For overly broad rules (e.g., `*`), suggest a more specific path based on the actual request
- Once a rule is created from a log entry, remove that entry from the view

## Success Criteria

- [ ] Permissions page displays entries from `permission-requests.jsonl`
- [ ] Each log entry shows: tool, pattern/command, project, and timestamp
- [ ] Log entries can be dismissed/removed without creating a rule
- [ ] Clicking "Add Rule" on a log entry opens rule creation with pre-filled values
- [ ] Scope selector shows project (default based on origin), area, and global options
- [ ] For `*` patterns, suggests a specific path derived from the request's cwd or file_path
- [ ] Creating a rule removes the log entry from the view (and from the JSONL file)
- [ ] Dismissing an entry removes it from the view (and from the JSONL file)
- [ ] API endpoint to read permission log entries
- [ ] API endpoint to delete specific log entries
- [ ] All existing tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors


## Execution Log

- 2026-01-28T16:13:49.358Z Work item created
- 2026-01-28T16:15:00.000Z Goals defined, success criteria added
