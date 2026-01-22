# Worktree Claude Code permission

## Metadata
- id: worktree-claude-code-permission-802
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: planned
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-worktree-claude-code-permission-802
- assigned-session:

## Description

When creating a new worktree, Claude Code should get the same permissions that it has in the parent project.

Permissions are stored in `{projectPath}/.claude/settings.json`. The `createWorktree()` function in `app/src/lib/terminal.ts` creates worktrees but doesn't copy/link the permissions. Fix: symlink the parent's `.claude` directory to the worktree so permissions are inherited.

## Success Criteria

- [ ] Symlink created on worktree creation - When `createWorktree()` successfully creates a worktree, it symlinks `{parentProject}/.claude` → `{worktreePath}/.claude`
- [ ] Handles missing `.claude` - If parent project has no `.claude` directory, skip symlinking (no error)
- [ ] Handles existing `.claude` - If worktree already exists with its own `.claude`, don't overwrite it
- [ ] All tests pass, no type errors

## Implementation Plan

### Phase 1: Add symlink helper function

**Step 1: Create `symlinkClaudeSettings()` function in `terminal.ts`**
- Add a new async function that:
  - Takes `projectPath` (source) and `worktreePath` (target)
  - Checks if `{projectPath}/.claude` exists - if not, return early (no error)
  - Checks if `{worktreePath}/.claude` already exists - if so, return early (don't overwrite)
  - Creates symlink: `{worktreePath}/.claude` → `{projectPath}/.claude`
- Use `fs.symlink()` with relative path for portability
- Wrap in try/catch to not fail worktree creation if symlink fails

### Phase 2: Integrate into worktree creation

**Step 2: Call symlink function in `createWorktree()`**
- After the git worktree is created (after line 64), call `symlinkClaudeSettings(projectPath, worktreePath)`
- Only call when worktree is newly created (not when it already exists)

### Verification

1. Run `npm run build` in `app/` - no type errors
2. Manual test: Create a worktree for a project that has `.claude/settings.json`
   - Verify symlink exists at `{worktree}/.claude`
   - Verify it points to parent's `.claude`
3. Manual test: Create a worktree for a project without `.claude/`
   - Verify no error, worktree created successfully

## Execution Log

- 2026-01-22T16:35:51.253Z Work item created
- 2026-01-22 Goals defined, success criteria added
- 2026-01-22 Implementation plan created
