# Merge feature

## Metadata
- id: merge-feature-284
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: review
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

- [x] New skill file created at `~/.claude/commands/flywheel-merge.md`
- [x] Command merges all open PRs for the repo using `gh pr merge`
- [x] After merge, fetches and pulls latest main branch locally
- [x] Cleans up any `.flywheel-prompt-*.txt` files in project directory
- [x] Cleans up any `.flywheel-transitioning-*` marker files in flywheel-gsd
- [x] Deletes local feature branches that were merged (if they still exist)
- [x] Handles merge failures gracefully (reports error, continues with other PRs)
- [x] Skill is registered in `CLAUDE.md` commands section

## Notes

- User will only run this after reviewing PRs, so no approval checks needed
- PRs should be force-merged if there are minor issues (user's decision to run = approval)
- Branch deletion on remote is typically automatic via GitHub settings, but local branches may linger

## Implementation Plan

### Phase 1: Create the Skill File

1. **Create `flywheel-merge.md` command file**
   - Location: `/Users/stevenellis/.claude/commands/flywheel-merge.md`
   - Follow same format as `flywheel-done.md`
   - Include environment setup with `FLYWHEEL_PATH`

### Phase 2: Implement Core Functionality

2. **List and merge all open PRs**
   - Use `gh pr list --json number,headRefName` to get all open PRs
   - Loop through each PR and run `gh pr merge <number> --squash --delete-branch`
   - Use `--squash` for clean history (can be configurable later)
   - `--delete-branch` handles remote branch cleanup
   - Capture success/failure for each PR

3. **Sync local main branch**
   - `git fetch origin`
   - `git checkout main` (if not already on main)
   - `git pull origin main`

4. **Clean up stray local branches**
   - Get list of merged branches: `git branch --merged main`
   - Exclude main/master from list
   - Delete each with `git branch -d <branch>`

5. **Clean up flywheel artifacts**
   - Remove `.flywheel-prompt-*.txt` files in current directory
   - Remove `.flywheel-transitioning-*` files in `$FLYWHEEL_PATH`

### Phase 3: Error Handling and Reporting

6. **Handle merge failures gracefully**
   - Try/catch around each PR merge
   - Collect failures into a list
   - Continue with other PRs even if one fails
   - Report all results at the end

7. **Final report**
   - List successfully merged PRs
   - List any failures with error messages
   - Confirm cleanup actions taken

### Verification

- Create test PR to verify merge works
- Run command with multiple PRs to test iteration
- Verify local cleanup happens correctly
- Check that CLAUDE.md commands section is updated

## Execution Log

- 2026-01-26T17:43:42.758Z Work item created
- 2026-01-26T17:44:30.000Z Goals defined, success criteria added
- 2026-01-26T17:46:00.000Z Implementation plan created
- 2026-01-26T17:47:00.000Z Execution started
- 2026-01-26T17:48:00.000Z Created flywheel-merge.md command file
- 2026-01-26T17:48:30.000Z Registered command in CLAUDE.md
- 2026-01-26T17:49:00.000Z All success criteria verified
- 2026-01-26T17:49:00.000Z Ready for /flywheel-done
