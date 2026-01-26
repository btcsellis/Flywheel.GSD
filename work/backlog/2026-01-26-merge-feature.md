# Merge feature

## Metadata
- id: merge-feature-284
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: defined
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Create a `/flywheel-merge` skill command that merges all open PRs for the current project and cleans up any remaining flywheel artifacts locally. This is a finalization command run after the user has reviewed PRs.

**Scope:**
- Merge all open PRs (user has already reviewed them)
- Sync local main branch with remote
- Clean up any stray flywheel files (prompt files, transitioning markers)
- Delete local feature branches if they still exist after PR merge

**Out of Scope:**
- Safety checks (user responsibility to review before running)
- Work item file management (already handled by `/flywheel-done`)
- Worktree cleanup (already handled by earlier commands)

## Success Criteria

- [ ] New skill file created at `skills/flywheel-merge.md`
- [ ] Command merges all open PRs for the repo using `gh pr merge`
- [ ] After merge, fetches and pulls latest main branch locally
- [ ] Cleans up any `.flywheel-prompt-*.txt` files in project directory
- [ ] Cleans up any `.flywheel-transitioning-*` marker files in flywheel-gsd
- [ ] Deletes local feature branches that were merged (if they still exist)
- [ ] Handles merge failures gracefully (reports error, continues with other PRs)
- [ ] Skill is registered in `CLAUDE.md` commands section

## Notes

- User will only run this after reviewing PRs, so no approval checks needed
- PRs should be force-merged if there are minor issues (user's decision to run = approval)
- Branch deletion on remote is typically automatic via GitHub settings, but local branches may linger

## Execution Log

- 2026-01-26T17:43:42.758Z Work item created
- 2026-01-26T17:44:30.000Z Goals defined, success criteria added
