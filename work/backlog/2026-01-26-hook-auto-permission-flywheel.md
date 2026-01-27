# Hook: Permission Collection and Management

## Metadata
- id: hook-auto-permission-flywheel-802
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: defined
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-hook-auto-permission-flywheel-802
- assigned-session: 

## Description

Implement a two-part system for managing Claude Code permission requests:

**Part 1: Permission Request Logging (Hook)**
Extend the existing `PermissionRequest` hook to log every permission request to a central file in the flywheel-gsd repo (`permissions/` directory). Each log entry captures the tool name, input pattern, project path, and timestamp. The hook continues to send Telegram notifications as before.

**Part 2: Permission Conversion Skill**
A Claude Code skill that reads the collected permission log, deduplicates and generalizes the requests into well-scoped permission entries, and writes them to `settings.local.json` at the user's chosen scope (project, global, or area). The skill presents proposed entries for confirmation before writing.

**Worktree Path Handling**
Permission requests from worktree paths (e.g. `flywheel-gsd-worktrees/branch-name/`) are normalized to generate entries covering both the base repo path and a worktrees glob pattern, avoiding overly specific per-branch permissions.

## Success Criteria

- [ ] PermissionRequest hook logs each request to `~/personal/flywheel-gsd/permissions/permission-requests.jsonl` with tool, input, project, and timestamp
- [ ] Existing Telegram notification behavior is preserved (hook extends, not replaces)
- [ ] Log entries from worktree paths include both the raw path and the normalized base repo path
- [ ] A new skill (e.g. `/flywheel-permissions`) reads the log and proposes deduplicated, well-scoped permission entries
- [ ] Skill asks user which scope level to write to: project `.claude/settings.local.json`, global `~/.claude/settings.local.json`, or skip
- [ ] Skill shows proposed entries and requires explicit confirmation before writing
- [ ] Worktree paths are generalized to cover both base repo (`flywheel-gsd/**`) and worktrees glob (`flywheel-gsd-worktrees/**`)
- [ ] Written permissions follow existing format patterns (e.g. `Read(path)`, `Bash(cmd:*)`, `Edit(path)`)
- [ ] Skill handles duplicate detection - doesn't propose entries that already exist in target settings file
- [ ] All existing tests pass, no type errors

## Notes

- Hook script location: `~/.claude/hooks/` (symlinked from telegram-integration)
- Current hook config is in `~/.claude/settings.local.json` under the `hooks` key
- Permission format examples: `Read(~/path/**)`, `Bash(git status:*)`, `Edit(~/path/**)`
- The JSONL format allows easy append-only logging and line-by-line processing
- Related work item: `handle-initial-permission-on-new-worktre-128` (initial trust for new worktrees)

## Execution Log

- 2026-01-27 Work item created
- 2026-01-27 Goals defined, success criteria added
