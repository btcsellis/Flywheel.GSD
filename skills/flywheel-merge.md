# Flywheel: Merge

Merge all open PRs for the current repo, sync local main, and clean up any stray flywheel artifacts.

This is a finalization command run after the user has reviewed all open PRs.

## Environment

```bash
FLYWHEEL_PATH="${FLYWHEEL_GSD_PATH:-$HOME/personal/flywheel-gsd}"
```

## Process

### 1. List Open PRs

Get all open PRs for the current repository:

```bash
gh pr list --json number,title,headRefName
```

If no PRs found, report and skip to cleanup.

### 2. Merge Each PR

For each open PR, merge with squash and delete the remote branch:

```bash
for PR_NUMBER in $(gh pr list --json number -q '.[].number'); do
  echo "Merging PR #$PR_NUMBER..."

  # Try to merge - squash for clean history, delete branch after
  if gh pr merge "$PR_NUMBER" --squash --delete-branch; then
    echo "  ✓ PR #$PR_NUMBER merged successfully"
    MERGED_PRS+=("$PR_NUMBER")
  else
    echo "  ✗ PR #$PR_NUMBER failed to merge"
    FAILED_PRS+=("$PR_NUMBER")
  fi
done
```

**Note:** Continue with remaining PRs even if one fails. Collect all results for final report.

### 3. Sync Local Main Branch

After merging, sync the local main branch with remote:

```bash
git fetch origin
git checkout main
git pull origin main
```

### 4. Clean Up Local Branches

Delete any local branches that have been merged:

```bash
# Get merged branches (excluding main/master)
for BRANCH in $(git branch --merged main | grep -v '^\*' | grep -vE '^\s*(main|master)$'); do
  echo "Deleting local branch: $BRANCH"
  git branch -d "$BRANCH" 2>/dev/null || true
done
```

### 5. Clean Up Flywheel Artifacts

Remove any stray flywheel files:

```bash
# Remove prompt files in current directory
rm -f .flywheel-prompt-*.txt 2>/dev/null

# Remove transitioning markers in flywheel-gsd
rm -f "$FLYWHEEL_PATH/.flywheel-transitioning-"* 2>/dev/null
```

### 6. Report Results

```markdown
## Merge Complete

### PRs Merged
- [List of successfully merged PRs]

### PRs Failed (if any)
- [List of PRs that failed to merge with reason]

### Local Sync
- Branch: main
- Status: Up to date with origin/main

### Cleanup
- Prompt files removed: [count]
- Transitioning markers removed: [count]
- Local branches deleted: [list]
```

## Error Handling

### PR Merge Fails

If a PR fails to merge:
1. Log the error
2. Add to failed list
3. Continue with remaining PRs
4. Report all failures at the end

Common failure reasons:
- Merge conflicts (user must resolve manually)
- Required checks not passed (shouldn't happen if user reviewed)
- Branch protection rules

### No PRs Found

If no open PRs exist:
```markdown
## No PRs to Merge

No open pull requests found for this repository.

### Cleanup Performed
- [cleanup actions taken]
```

## Usage

Run from any git repository:

```bash
/flywheel-merge
```

## Key Rules

1. **User has already reviewed PRs** - no additional approval checks
2. **Continue on failure** - merge other PRs even if one fails
3. **Clean up everything** - branches, prompt files, transitioning markers
4. **Report all results** - clear summary of what happened
