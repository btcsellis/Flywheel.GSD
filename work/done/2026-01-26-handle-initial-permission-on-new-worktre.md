# Handle initial permission on new worktree

## Metadata
- id: handle-initial-permission-on-new-worktre-128
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-handle-initial-permission-on-new-worktre-128
- assigned-session: 

## Description

When flywheel kicks off a new worktree, Claude Code shows a "Do you trust the files in this folder?" prompt. This blocks unattended execution and requires manual intervention.

**Root cause**: Claude Code stores workspace trust in `~/.claude.json` under `projects["/path/to/workspace"].hasTrustDialogAccepted`. When flywheel creates a worktree, no entry exists for the new worktree path, so Claude prompts.

**Solution**: During worktree creation in `app/src/lib/terminal.ts`, after creating the worktree and copying `.claude/` settings, also update `~/.claude.json` to set `hasTrustDialogAccepted: true` for the new worktree path. This pre-approves the workspace trust dialog before Claude Code launches.

The `~/.claude.json` `projects` object uses absolute paths as keys and stores per-project config including `hasTrustDialogAccepted`, `allowedTools`, etc. We need to read the file, add/update the worktree path entry, and write it back.

## Success Criteria

- [x] When flywheel creates a worktree, `~/.claude.json` is updated with a `projects[worktreePath].hasTrustDialogAccepted = true` entry
- [x] The existing `~/.claude.json` content is preserved (read-modify-write, not overwrite)
- [x] If the worktree path already exists in `~/.claude.json`, only `hasTrustDialogAccepted` is updated (other keys preserved)
- [x] If `~/.claude.json` doesn't exist or has no `projects` key, it's handled gracefully
- [ ] Claude Code no longer shows the "Do you trust the files in this folder?" prompt for flywheel-created worktrees
- [x] All tests pass
- [x] No type errors

## Implementation Plan

### Phase 1: Add trust pre-approval function

1. **Create `preApproveWorktreeTrust` function in `app/src/lib/terminal.ts`**
   - Read `~/.claude.json` (handle missing file gracefully — return empty `{}`)
   - Parse JSON, ensure `projects` key exists (default to `{}`)
   - Set `projects[worktreePath].hasTrustDialogAccepted = true`, preserving any existing keys on that project entry
   - Write back to `~/.claude.json` with `JSON.stringify(data, null, 2)`
   - Wrap in try/catch — failure should not block worktree creation (log silently)

2. **Call `preApproveWorktreeTrust` from `createWorktree`**
   - After `copyClaudeSettingsForWorktree(projectPath, worktreePath)` on line 247
   - Call `await preApproveWorktreeTrust(worktreePath)`
   - This ensures trust is set before Claude Code launches

### Phase 2: Verification

3. **Run typecheck**: `npm run typecheck` in `app/`
4. **Run tests**: `npm test` in `app/` (if test suite exists)
5. **Manual verification**: Create a worktree, check `~/.claude.json` has the entry

### Files to Modify

- `app/src/lib/terminal.ts` — add `preApproveWorktreeTrust()` function and call it from `createWorktree()`

## Execution Log

- 2026-01-26T16:20:38.429Z Work item created
- 2026-01-27T12:50:00.000Z Goals defined, success criteria added. Root cause identified: trust stored in ~/.claude.json projects[path].hasTrustDialogAccepted
- 2026-01-27T12:55:00.000Z Implementation plan created
