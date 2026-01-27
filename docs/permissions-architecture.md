# Permissions Architecture

## Multi-Area Config via CLAUDE_CONFIG_DIR

Steven uses `direnv` to set `CLAUDE_CONFIG_DIR` per workspace area, replacing `~/.claude/` with an area-specific directory:

- `~/.claude-personal/` — personal projects (under `~/personal/`)
- `~/.claude-bellwether/` — bellwether projects
- `~/.claude-sophia/` — sophia projects
- `~/.claude/` — fallback when no CLAUDE_CONFIG_DIR is set

Each area has its own `settings.local.json` (user permissions) and `.claude.json` (trust, session data).

## Settings File Hierarchy

Claude Code loads permissions from multiple levels:

1. **User-level**: `$CLAUDE_CONFIG_DIR/settings.local.json` — user-specific permissions (not shared)
2. **Project-level checked-in**: `<project>/.claude/settings.json` — shared with all repo users
3. **Project-level local**: `<project>/.claude/settings.local.json` — user-specific, per-project

`settings.local.json` should be gitignored. `settings.json` is checked in (currently `{}` for this repo).

## Permission Logging and Processing

1. **Hook** (`~/.claude/hooks/log-permission-request.sh`) — automatically logs every permission prompt to `permissions/permission-requests.jsonl`
2. **Skill** (`/flywheel-permissions`) — processes the log, deduplicates, proposes rules, writes to settings files
3. **Dashboard** (`app/src/lib/permissions.ts`) — UI for managing permissions with multi-area sync

## Worktree Permissions

When flywheel creates a worktree (`app/src/lib/terminal.ts`):

1. **Settings copy**: `copyClaudeSettingsForWorktree()` copies each settings file individually from the main repo's `.claude/` to the worktree's `.claude/`, skipping files that already exist. Rewrites project paths to worktree paths (except flywheel-specific rules).
2. **Trust pre-approval**: `preApproveWorktreeTrust()` writes `hasTrustDialogAccepted: true` to `$CLAUDE_CONFIG_DIR/.claude.json` (not `~/.claude.json`).

## Key Gotchas

- **CLAUDE_CONFIG_DIR affects `.claude.json` location**: Trust data, session data, and project metadata are read from `$CLAUDE_CONFIG_DIR/.claude.json`, not `~/.claude.json`. Any code writing to these must respect the env var.
- **Worktree `.claude/` dir may pre-exist**: `git worktree add` checks out tracked files, so if `.claude/settings.json` is tracked (even as `{}`), the `.claude/` dir will exist before the copy function runs. The copy function must handle each file individually rather than bailing if the directory exists.
- **Dual-path permissions**: The permissions skill generates rules for both `~/personal/flywheel-gsd/**` and `~/personal/flywheel-gsd-worktrees/**` to cover both main repo and worktree access.
- **Global rules must sync to all areas**: Writing a "global" permission requires writing to all 4 settings files (`~/.claude/` + 3 area configs) since each area overrides the config dir.
