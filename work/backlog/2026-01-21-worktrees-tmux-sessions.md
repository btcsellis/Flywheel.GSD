# Worktrees / tmux sessions

## Metadata
- id: worktrees-tmux-sessions-183
- project: personal/flywheel-gsd
- created: 2026-01-21
- status: new
- assigned-session: 

## Description

When calling Claude Code, let's either use the main git branch, which would use a tmux session for that project, or create a worktree, which would create a new tmux session. This question is really only relevant when going from new to defined. After that, it will just keep using the same tmux session. Subsequent steps should handle things gracefully (finding and using the right tmux pane, or starting a new one with the right session, handling git properly, cleaning up the right things.) If we start in main, no need to create a branch and issue a pr on ship. just commit and sync.

## Success Criteria


## Execution Log

- 2026-01-21T22:18:20.518Z Work item created
