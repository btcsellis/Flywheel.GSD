# Flywheel: Done

Commit, push, create PR (if applicable), archive work item, and clean up. Transitions `review` → `done`.

This command merges the functionality of the old `/flywheel-ship` and `/flywheel-cleanup` commands.

## Environment

```bash
FLYWHEEL_PATH="${FLYWHEEL_GSD_PATH:-$HOME/personal/flywheel-gsd}"
```

## Process

### 1. Load the Work Item

Check for a prompt file first (launched from dashboard):
```bash
if [ -f .flywheel-prompt-*.txt ]; then
  cat .flywheel-prompt-*.txt
fi
```

Or find a `review` work item:
```bash
for file in "$FLYWHEEL_PATH/work/active/"*.md; do
  if grep -q "^- status: review" "$file" 2>/dev/null; then
    echo "Found: $file"
    WORK_ITEM_PATH="$file"
    WORK_ITEM_FILENAME=$(basename "$file")
  fi
done
```

Read the work item to understand:
- The workflow type (main vs worktree)
- Success criteria (verify they're all checked)
- The tmux session name

### 2. Final Verification

Run the project's verification commands (from CLAUDE.md):
```bash
npm run typecheck  # or equivalent
npm run lint       # or equivalent
npm run test       # or equivalent
```

If any fail, fix the issues first before proceeding.

### 3. Check All Success Criteria

Verify all success criteria are marked complete `[x]` in the work item.
If any are not complete, stop and report what's missing.

### 4. Stage and Commit

```bash
git status --short
git add -A
```

Create a meaningful commit message following conventional commits:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code restructure
- test: Adding tests
- chore: Maintenance

Include work item reference in commit body:

```bash
git commit -m "[type]: [description]

[Optional body with more details]

Flywheel: [work-item-id]"
```

### 5. Push and Create PR (Workflow Dependent)

Read the `workflow` field from work item metadata.

#### If workflow is `main`:
```bash
git push origin main
```
No PR created - work goes directly to main.

#### If workflow is `worktree` or unset:

Check we're not on main:
```bash
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "ERROR: You're on main. Create a feature branch first."
  exit 1
fi
```

Push and create PR:
```bash
git push -u origin HEAD

gh pr create \
  --title "[Work item title]" \
  --body "## Summary
[From work item description]

## Changes
- [Key changes made]

## Success Criteria Verified
- [x] [Criterion 1]
- [x] [Criterion 2]

## Testing
[Verification commands that passed]

## Flywheel
Work Item: [id]"
```

Capture the PR URL from the output.

### 6. Archive Work Item

Move work item to done folder:
```bash
mv "$FLYWHEEL_PATH/work/active/$WORK_ITEM_FILENAME" "$FLYWHEEL_PATH/work/done/"
```

Update the work item:
- Set `status: done`
- Clear `assigned-session:`
- Add completion log entry:

```markdown
## Execution Log
- [previous entries]
- [timestamp] Committed and pushed
- [timestamp] PR created: [URL]  # if worktree workflow
- [timestamp] Work item completed
```

### 7. Commit Flywheel Changes

```bash
cd "$FLYWHEEL_PATH"
git add work/
git commit -m "chore: complete work item [id]

PR: [PR_URL]"  # Or "Shipped to main" for main workflow
git push
cd -
```

### 8. Clean Up

#### Clean up prompt files:
```bash
rm -f .flywheel-prompt-*.txt 2>/dev/null
```

#### If workflow is `worktree`:

**CRITICAL: Capture info BEFORE changing directory:**
```bash
WORKTREE_PATH=$(pwd)
MAIN_PROJECT=$(git worktree list | head -1 | awk '{print $1}')
BRANCH=$(git branch --show-current)
```

**Migrate Worktree Permissions (before cleanup):**

Check if the worktree has `.claude/settings.json` with permissions that should be migrated to the main project:

```bash
# Check if worktree has settings
if [ -f "$WORKTREE_PATH/.claude/settings.json" ]; then
  # Read worktree permissions
  WORKTREE_SETTINGS="$WORKTREE_PATH/.claude/settings.json"
  MAIN_SETTINGS="$MAIN_PROJECT/.claude/settings.json"
fi
```

**If worktree settings exist:**

1. Read the permissions from `$WORKTREE_PATH/.claude/settings.json`
2. For each permission, check if it contains the worktree path
3. Replace worktree path with main project path
4. Compare with main project's existing permissions (avoid duplicates)

**Present migration prompt:**

```markdown
## Permissions Migration

Found permissions in worktree that can be migrated to main project:

**Worktree permissions to migrate:**
- [List permissions with paths corrected]

**Already in main project (will skip):**
- [List any duplicates]

**Options:**
1. **Migrate** - Copy permissions to main project's .claude/settings.json
2. **Skip** - Don't migrate (permissions will be lost when worktree is deleted)

Choose (1/2): _
```

**If user approves migration:**

1. Ensure `$MAIN_PROJECT/.claude/` directory exists
2. If `$MAIN_PROJECT/.claude/settings.json` doesn't exist, create it with empty structure:
   ```json
   {"permissions": {"allow": []}}
   ```
3. Merge the migrated permissions (with corrected paths) into the main project settings
4. Avoid duplicates - only add permissions not already present
5. Write the updated settings.json

**If no worktree settings exist:**
Silently continue to cleanup - don't prompt if nothing to migrate.

**Navigate to main project FIRST** (critical - prevents shell from breaking):
```bash
cd "$MAIN_PROJECT"
```

**Prune orphaned worktree references:**
```bash
git worktree prune
```

**Remove worktree:**
```bash
# Remove git worktree registration
git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true

# Always remove the directory — git worktree remove leaves behind
# untracked files (e.g. .claude/settings.local.json)
rm -rf "$WORKTREE_PATH" 2>/dev/null || true
```

**Delete the branch:**
```bash
git branch -d "$BRANCH" 2>/dev/null || git branch -D "$BRANCH" 2>/dev/null || true
```

**Worktree Cleanup Error Handling:**
- `git worktree remove` deregisters the worktree; `rm -rf` ensures the directory is fully removed
- If the directory doesn't exist, that's fine - cleanup is already done
- If all cleanup fails, report the issue and let the user clean up manually

#### Kill tmux session:
```bash
TMUX_SESSION=$(grep "^- tmux-session:" "$FLYWHEEL_PATH/work/done/$WORK_ITEM_FILENAME" | cut -d: -f2 | xargs)
if [ -n "$TMUX_SESSION" ]; then
  tmux kill-session -t "$TMUX_SESSION" 2>/dev/null || true
fi
```

### 9. Capture Learnings (Auto-Detect)

After completing the work, analyze the session for learnings worth capturing.

#### Detection Heuristics

Scan the **execution log** and **conversation history** for signals:

1. **Retry patterns**: Multiple attempts at the same operation
2. **Error resolutions**: Error messages that were eventually fixed
3. **Workarounds**: Non-obvious solutions, fallbacks used
4. **Repeated issues**: Problems that have occurred before

**Keywords to look for:**
- "retry", "failed", "error", "workaround", "fallback"
- "finally worked", "the fix was", "turns out"
- "this keeps happening", "again", "same issue"

#### If Learning Detected

Draft a solution document using this format:

```markdown
---
date: [TODAY]
category: [tool-environment | flywheel-patterns | project-specific]
tags: [relevant, keywords]
---

# [Brief title describing the problem/solution]

## Problem
[What went wrong - include exact error messages]

## Solution
[What fixed it - step by step]

## Prevention
[How to avoid this next time]
```

**Present to user with options:**

```markdown
## Learning Detected

I noticed [brief description of what was learned].

**Draft solution:**
[Show the draft document]

**Options:**
1. **Save as-is** - Save to `solutions/[category]/`
2. **Edit first** - Let me modify before saving
3. **Skip** - Don't capture this learning

Choose (1/2/3): _
```

#### If User Approves (Option 1 or 2)

1. Generate filename from title (kebab-case, max 50 chars)
2. Save to `$FLYWHEEL_PATH/solutions/[category]/[filename].md`
3. Add to flywheel git commit:

```bash
cd "$FLYWHEEL_PATH"
git add solutions/
# Include in the existing commit or create separate:
# Already committed above, so just add to next push
```

4. Report: "Learning saved to `solutions/[category]/[filename].md`"

#### If No Learning Detected

Silently continue to Report section. Don't prompt if nothing worth capturing.

### 10. Report

#### For main workflow:
```markdown
## Done

### Git
- **Commit**: [hash]
- **Branch**: main
- **Pushed**: Yes

### Flywheel
- **Work Item**: [id]
- **Status**: done
- **Location**: work/done/[filename]

### Cleanup
- Prompt files removed
- Tmux session killed (if applicable)

### Ready for Next
Run `/flywheel-new` to create another work item.
```

#### For worktree workflow:
```markdown
## Done

### Git
- **Commit**: [hash]
- **Branch**: [branch]
- **PR**: [PR_URL]

### Flywheel
- **Work Item**: [id]
- **Status**: done
- **Location**: work/done/[filename]

### Cleanup
- Worktree removed: [path]
- Branch deleted: [branch]
- Prompt files removed
- Tmux session killed
- Now in: [main project]

### Ready for Next
Run `/flywheel-new` to create another work item.
```

## Status Transition

```
review → done
```

## If Work Item Not in Review

If status is `new`:
- Suggest running `/flywheel-define` first

If status is `defined`:
- Suggest running `/flywheel-plan` first

If status is `planned` or `executing`:
- Suggest running `/flywheel-execute` to complete implementation

If status is already `done`:
- Report that work item is already complete
- No action needed

## Error Handling

### PR Creation Fails
- Check `gh auth status`
- Verify branch is pushed
- Report error and suggest manual PR creation

### Flywheel Update Fails
- Report error but don't block shipping
- Suggest manual move: `mv work/active/[item] work/done/`
- PR/commit is the priority - work item tracking is secondary

### Commit Fails (pre-commit hooks)
- Run the failing checks
- Fix issues
- Retry commit
- Max 3 attempts before reporting blocked

## Key Rules

1. **Always verify before shipping** - run all project checks first
2. **Navigate to main project BEFORE removing worktree** - prevents shell breakage
3. **Always kill the tmux session** - frees resources and avoids confusion
4. **Archive work item after successful push** - keeps done/ as permanent record
5. **Main workflow is simpler** - no branches, no PRs, no worktree cleanup
6. **Do NOT retry failing cleanup commands** - if a command fails, use the fallback approach or report the issue; never retry the same failing command more than once
