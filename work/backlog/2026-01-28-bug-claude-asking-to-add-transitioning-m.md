# Bug - Claude asking to add transitioning marker

## Metadata
- id: bug-claude-asking-to-add-transitioning-m-376
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: defined
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-bug-claude-asking-to-add-transitioning-m-376
- assigned-session:

## Description

We already worked a story to avoid this prompt, but now it's back. There may have been some conflicts with other hooks, and maybe fixing the other hook broke this one. If that's possble, let's make sure we don't break the telegram or other hooks when working this item

### Root Cause Analysis

The issue stems from **redundant marker creation** between two systems:

1. **Dashboard API** (`launch-button.tsx` → `/api/transitioning`) - Creates the marker immediately when "Launch" is clicked
2. **Skill scripts** (all 4 flywheel skills) - Contain bash heredoc instructions to create/update the marker

The skills instruct Claude to run a `cat > heredoc` command to create the marker. Even though permissions exist for `Bash(cat > ~/personal/flywheel-gsd/.flywheel-*:*)`, Claude may still prompt because:
- The skill instructions phrase it as an action to perform, not a command that's already permitted
- The exact command format in the heredoc doesn't match the permission pattern precisely

### Solution Approach

Remove the "Mark as Transitioning" step from all skill scripts since the dashboard already creates the marker before the skill starts. This eliminates the redundant action and removes the permission prompt entirely.

## Success Criteria

- [ ] All flywheel skill files (`flywheel-define.md`, `flywheel-plan.md`, `flywheel-execute.md`, `flywheel-done.md`) have the "Mark as Transitioning" section removed
- [ ] Dashboard continues to create transitioning markers via API (no changes to dashboard code)
- [ ] Skills no longer prompt Claude to add transitioning marker when launched from dashboard
- [ ] Telegram hook continues to work (verify not broken by changes)
- [ ] Other hooks (log-permission-request, etc.) continue to work
- [ ] All tests pass (`npm run typecheck` in app/)



## Execution Log

- 2026-01-28T14:37:42.027Z Work item created
- 2026-01-28T14:46:00.000Z Goals defined, success criteria added
