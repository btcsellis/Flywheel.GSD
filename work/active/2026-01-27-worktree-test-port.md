# Worktree test port

## Metadata
- id: worktree-test-port-664
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: review
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

When running the app to test in a worktree, use an alternate port, as it will probably already be running on 3000 in the main branch. The flywheel-execute skill should detect when it's running in a worktree and automatically find an available port (checking 3001, 3002, etc.) before starting the dev server for browser verification. Use Next.js `--port` flag.

## Success Criteria

- [x] flywheel-execute skill detects when running in a git worktree (vs main working tree)
- [x] When in a worktree, skill probes ports starting at 3001 to find an available one
- [x] Dev server is started with `--port <available_port>` when in a worktree
- [x] Browser verification URLs use the detected port instead of hardcoded 3000
- [x] When not in a worktree, behavior is unchanged (uses default port 3000)
- [x] No type errors (N/A — markdown only)
- [x] App builds successfully (N/A — markdown only)

## Notes

- Logic lives in the flywheel-execute skill markdown (`~/.claude/commands/flywheel-execute.md`)
- Add a new section (e.g. "2c. Detect Worktree Port") before the execute loop
- Port detection can use `lsof -i :PORT` or `nc -z localhost PORT` to check availability
- Use `git worktree list` to detect if current directory is a worktree
- Store the detected port in a variable for use in browser verification navigate calls

## Implementation Plan

### Phase 1: Add worktree port detection section to flywheel-execute skill

1. **Add "2c. Detect Worktree Port" section**
   - File: `~/.claude/commands/flywheel-execute.md`
   - Insert new section after "2b. Check Chrome Plugin" and before "3. Execute Loop"
   - Content:
     - Detect if current directory is a worktree using `git rev-parse --git-dir` (worktrees have `.git` as a file, not a directory) or compare against `git worktree list` first entry
     - If worktree: probe ports 3001, 3002, ... using `lsof -i :PORT` until one is free
     - Set `DEV_PORT` variable (default 3000 for non-worktree, detected port for worktree)
     - Instruct the agent to use `npm run dev -- --port $DEV_PORT` when starting dev server
     - Instruct the agent to use `http://localhost:$DEV_PORT` for all browser verification URLs

2. **Update "5a. Execute Browser Verification" section**
   - File: `~/.claude/commands/flywheel-execute.md`
   - Update the browser verification instructions to reference `$DEV_PORT` instead of hardcoded port
   - Update example navigate URL from `http://localhost:3000/dashboard` to `http://localhost:$DEV_PORT/dashboard`

### Verification

- Read the updated file and confirm both sections are present
- No build needed (markdown skill file)

## Execution Log

- 2026-01-27T13:57:39.528Z Work item created
- 2026-01-27T16:00:00.000Z Goals defined, success criteria added
- 2026-01-27T16:05:00.000Z Implementation plan created
- 2026-01-27T16:10:00.000Z Added "2c. Detect Worktree Port" section to flywheel-execute.md
- 2026-01-27T16:10:00.000Z Updated browser verification example to use $DEV_PORT
- 2026-01-27T16:10:00.000Z All success criteria verified
- 2026-01-27T16:10:00.000Z Ready for /flywheel-done
