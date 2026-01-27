# Hook: Permission Collection and Management

## Metadata
- id: hook-auto-permission-flywheel-802
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: review
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

- [x] PermissionRequest hook logs each request to `~/personal/flywheel-gsd/permissions/permission-requests.jsonl` with tool, input, project, and timestamp
- [x] Existing Telegram notification behavior is preserved (hook extends, not replaces)
- [x] Log entries from worktree paths include both the raw path and the normalized base repo path
- [x] A new skill (e.g. `/flywheel-permissions`) reads the log and proposes deduplicated, well-scoped permission entries
- [x] Skill asks user which scope level to write to: project `.claude/settings.local.json`, global `~/.claude/settings.local.json`, or skip
- [x] Skill shows proposed entries and requires explicit confirmation before writing
- [x] Worktree paths are generalized to cover both base repo (`flywheel-gsd/**`) and worktrees glob (`flywheel-gsd-worktrees/**`)
- [x] Written permissions follow existing format patterns (e.g. `Read(path)`, `Bash(cmd:*)`, `Edit(path)`)
- [x] Skill handles duplicate detection - doesn't propose entries that already exist in target settings file
- [x] All existing tests pass, no type errors

## Notes

- Hook script location: `~/.claude/hooks/` (symlinked from telegram-integration)
- Current hook config is in `~/.claude/settings.local.json` under the `hooks` key
- Permission format examples: `Read(~/path/**)`, `Bash(git status:*)`, `Edit(~/path/**)`
- The JSONL format allows easy append-only logging and line-by-line processing
- Related work item: `handle-initial-permission-on-new-worktre-128` (initial trust for new worktrees)

## Implementation Plan

### Phase 1: Permission Request Logging Hook

1. **Create permissions directory**
   - Create `~/personal/flywheel-gsd/permissions/` directory
   - Add `.gitkeep` to track it in git

2. **Create `log-permission-request.sh` hook script**
   - Location: `~/personal/telegram-integration/hooks/log-permission-request.sh` (symlinked from `~/.claude/hooks/`)
   - Reads JSON from stdin (same as telegram-notify.sh): `hook_event_name`, `tool_name`, `tool_input`, `session_id`, `cwd`
   - Appends a JSONL line to `~/personal/flywheel-gsd/permissions/permission-requests.jsonl`
   - Each line: `{"timestamp":"ISO","tool":"Bash","input":{"command":"..."},"cwd":"/path","project":"project-name","raw_path":"/full/worktree/path","base_repo_path":"flywheel-gsd"}`
   - Worktree detection: if `cwd` contains `-worktrees/`, extract the base repo name (strip `-worktrees/branch-name`)
   - Script is independent from telegram-notify.sh — does not modify it

3. **Register the new hook in global settings**
   - Add a second hook entry under `PermissionRequest` in `~/.claude/settings.local.json`
   - The existing telegram-notify.sh hook stays untouched
   - New entry: `{"type": "command", "command": "~/.claude/hooks/log-permission-request.sh"}`

4. **Symlink the script**
   - `ln -s ~/personal/telegram-integration/hooks/log-permission-request.sh ~/.claude/hooks/log-permission-request.sh`

### Phase 2: Permission Conversion Skill

5. **Create `/flywheel-permissions` command**
   - Location: `~/.claude/commands/flywheel-permissions.md`
   - This is a Claude Code slash command (skill) that Claude interprets as instructions

6. **Skill behavior (markdown instructions)**
   - Read `~/personal/flywheel-gsd/permissions/permission-requests.jsonl`
   - Parse each line, extract tool + input to derive permission string
   - Permission derivation logic:
     - `Bash` → `Bash(command_prefix:*)` where prefix is first word(s) of command
     - `Read` → `Read(path_glob)` with `**` suffix on directory
     - `Edit` → `Edit(path_glob)` with `**` suffix on directory
     - `Write` → `Write(path_glob)`
     - `WebFetch` → `WebFetch(domain:hostname)`
     - Other tools → `ToolName(relevant_input_pattern)`
   - Worktree normalization: for paths containing `-worktrees/branch/`, generate TWO entries:
     - One for base repo: e.g. `Read(~/personal/flywheel-gsd/**)`
     - One for worktrees: e.g. `Read(~/personal/flywheel-gsd-worktrees/**)`
   - Deduplicate: group identical permission strings
   - Show frequency count for each proposed permission
   - Read target `settings.local.json` and filter out already-present entries
   - Present remaining entries grouped by tool type
   - Ask user to choose scope: project `.claude/settings.local.json`, global `~/.claude/settings.local.json`, or skip
   - After confirmation, read the target file, add entries to `permissions.allow`, write back
   - Optionally clear processed entries from the log (ask user)

7. **Register the skill**
   - Add `"Skill(flywheel-permissions)"` to global `settings.local.json` allow list

### Verification

- Manually trigger a permission request and verify JSONL line is appended
- Run `/flywheel-permissions` and verify it reads the log, proposes entries, and writes to settings
- Confirm existing telegram-notify.sh still fires on PermissionRequest
- Run `npm run build && npm run lint && npm run typecheck` in the app directory

## Execution Log

- 2026-01-27 Work item created
- 2026-01-27 Goals defined, success criteria added
- 2026-01-27 Implementation plan created
- 2026-01-27 16:45 Created permissions/ directory with .gitkeep
- 2026-01-27 16:45 Created log-permission-request.sh hook script in telegram-integration
- 2026-01-27 16:45 Symlinked hook to ~/.claude/hooks/
- 2026-01-27 16:45 Registered hook in global settings.local.json (second PermissionRequest entry)
- 2026-01-27 16:45 Created /flywheel-permissions skill command
- 2026-01-27 16:45 Registered Skill(flywheel-permissions) in global settings
- 2026-01-27 16:45 Tested hook: worktree path correctly logs base_repo_path, AskUserQuestion correctly skipped
- 2026-01-27 16:45 Build passes, all success criteria verified
- 2026-01-27 16:45 Ready for /flywheel-done
