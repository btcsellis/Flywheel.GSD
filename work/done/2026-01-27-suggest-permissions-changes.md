# Suggest permissions changes

## Metadata
- id: suggest-permissions-changes-827
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Please use Chrome to review the current permissions dashboard and suggest improvements to the permissions in place. The goal is to reduce the number of settings, prevent uinnecessary ask permission prompts, and have reasonable guardrails for potentially dangerous actions. Execution may involve actually making permissions changes.

## Success Criteria
- [x] User-level settings consolidated to common dev tools only
- [x] Area-level settings created for personal, sophia, bellwether
- [x] Project-level settings trimmed to project-specific rules only
- [x] Stale/obsolete rules removed
- [x] Permissions dashboard visually verified
- [x] Flywheel skill runs without permission prompts

## Plan

Three-tier permission hierarchy: user-level (common dev tools), area-level (area-specific tooling), project-level (project-only rules).

### Phase 1: Update user-level (`~/.claude/settings.local.json`)
Consolidate common rules: file ops, git, build/test, npm, tmux, gh CLI, flywheel, utilities, notifications, WebSearch. Remove stale one-off rules.

### Phase 2: Create area-level settings
- `~/.claude-personal/settings.local.json`: WebFetch (localhost, claudelog.com, clawd.bot, github.com), frontend-design skill, Chrome native host
- `~/.claude-sophia/settings.local.json`: python3, pip3, Azure CLI, WebFetch (unrestricted), curl, tee
- `~/.claude-bellwether/settings.local.json`: empty for now

### Phase 3: Trim project-level settings
- flywheel-gsd: keep only `npm run typecheck:*`, `npm run:*`, `pkill:*`
- sophia projects: clear (moved to area)
- personal projects: clear (moved to user)

### Phase 4: Clean up stale rules
Remove: absolute-path git commands, `[ -f PLAN.md ]`, `flywheel-ship`, `printf:*`, `claude --version:*`, duplicate rm patterns

## Execution Log

- 2026-01-27T15:29:52.935Z Work item created
- 2026-01-27 Phase 1: Consolidated user-level settings from 89 rules to ~80 organized rules, removed stale entries (absolute-path git, [ -f PLAN.md ], flywheel-ship, printf, claude --version, duplicate tmux)
- 2026-01-27 Phase 2: Created ~/.claude-personal/settings.local.json (WebFetch, frontend-design, chrome host), ~/.claude-sophia/settings.local.json (python, azure, curl), ~/.claude-bellwether/settings.local.json (empty)
- 2026-01-27 Phase 3: Trimmed flywheel-gsd to 3 rules (npm run typecheck, npm run, pkill). Cleared personal/ and sophia/ project-level settings (moved to user/area)
- 2026-01-27 Phase 4: Stale rules removed as part of Phase 1 rewrite
- 2026-01-27 Fixed dashboard to read from settings.local.json instead of settings.json
- 2026-01-27 Updated dashboard description text to reference settings.local.json
- 2026-01-27 All success criteria verified
- 2026-01-27 Ready for /flywheel-done
- 2026-01-27 Committed and pushed to main (9ea1c3b)
- 2026-01-27 Work item completed
