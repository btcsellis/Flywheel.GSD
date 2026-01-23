---
date: 2026-01-22
category: tool-environment
tags: [git, worktree, cleanup, cwd, shell]
---

# Worktree cleanup fails when shell cwd is inside worktree

## Problem

`git worktree remove` fails with repeated "Path does not exist" errors when the shell's current working directory is inside the worktree being removed.

**Error messages:**
```
fatal: '/path/to/worktree' is not a working tree
```

After the worktree directory is deleted or becomes orphaned, the shell's cwd becomes invalid, causing ALL subsequent bash commands to fail until cwd is reset.

## Solution

1. **Capture worktree info BEFORE changing directory:**
   ```bash
   WORKTREE_PATH=$(pwd)
   MAIN_PROJECT=$(git worktree list | head -1 | awk '{print $1}')
   BRANCH=$(git branch --show-current)
   ```

2. **Navigate to main project FIRST:**
   ```bash
   cd "$MAIN_PROJECT"
   ```

3. **Prune orphaned worktree references:**
   ```bash
   git worktree prune
   ```

4. **Remove worktree with fallback:**
   ```bash
   git worktree remove "$WORKTREE_PATH" --force 2>/dev/null

   # If that fails, use rm -rf
   if [ -d "$WORKTREE_PATH" ]; then
     rm -rf "$WORKTREE_PATH"
   fi
   ```

5. **Delete the branch:**
   ```bash
   git branch -d "$BRANCH" 2>/dev/null || git branch -D "$BRANCH" 2>/dev/null || true
   ```

## Prevention

- Always `cd` out of a directory before deleting it
- Run `git worktree prune` before attempting removal
- Have a fallback (`rm -rf`) when git commands fail
- Don't retry the same failing command - use the fallback instead
