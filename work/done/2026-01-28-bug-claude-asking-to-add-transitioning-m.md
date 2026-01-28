# Bug - Claude asking to add transitioning marker

## Metadata
- id: bug-claude-asking-to-add-transitioning-m-376
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: done
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

- [x] All flywheel skill files (`flywheel-define.md`, `flywheel-plan.md`, `flywheel-execute.md`, `flywheel-done.md`) have the "Mark as Transitioning" section removed
- [x] Dashboard continues to create transitioning markers via API (no changes to dashboard code)
- [x] Skills no longer prompt Claude to add transitioning marker when launched from dashboard
- [x] Telegram hook continues to work (verify not broken by changes)
- [x] Other hooks (log-permission-request, etc.) continue to work
- [x] All tests pass (`npm run build` in app/)

## Implementation Plan

### Phase 1: Remove Transitioning Marker Sections from Skills

All four skill files have identical "Mark as Transitioning" sections (step 1a) that need to be removed. The section spans from `### 1a. Mark as Transitioning` through the closing explanation paragraph ending with "The dashboard automatically clears it when the status changes."

1. **Remove from flywheel-define.md**
   - File: `/Users/stevenellis/personal/flywheel-gsd/skills/flywheel-define.md`
   - Remove lines 51-70 (the entire "### 1a. Mark as Transitioning" section)
   - Verification: File no longer contains "Mark as Transitioning"

2. **Remove from flywheel-plan.md**
   - File: `/Users/stevenellis/personal/flywheel-gsd/skills/flywheel-plan.md`
   - Remove lines 52-71 (the entire "### 1a. Mark as Transitioning" section)
   - Verification: File no longer contains "Mark as Transitioning"

3. **Remove from flywheel-execute.md**
   - File: `/Users/stevenellis/personal/flywheel-gsd/skills/flywheel-execute.md`
   - Remove lines 37-56 (the entire "### 1a. Mark as Transitioning" section)
   - Verification: File no longer contains "Mark as Transitioning"

4. **Remove from flywheel-done.md**
   - File: `/Users/stevenellis/personal/flywheel-gsd/skills/flywheel-done.md`
   - Remove lines 40-59 (the entire "### 1a. Mark as Transitioning" section)
   - Verification: File no longer contains "Mark as Transitioning"

### Phase 2: Verification

5. **Verify no transitioning marker references remain in skills**
   - Command: `grep -r "Mark as Transitioning" skills/`
   - Expected: No matches

6. **Verify hooks are unaffected**
   - Telegram hook doesn't reference transitioning markers (confirmed - separate concern)
   - Log-permission-request hook doesn't reference transitioning markers (confirmed)

7. **Run typecheck**
   - Command: `cd /Users/stevenellis/personal/flywheel-gsd/app && npm run typecheck`
   - Expected: No errors

### Files to Modify

- `skills/flywheel-define.md` - Remove section 1a
- `skills/flywheel-plan.md` - Remove section 1a
- `skills/flywheel-execute.md` - Remove section 1a
- `skills/flywheel-done.md` - Remove section 1a

### Files NOT Modified (by design)

- `app/src/components/launch-button.tsx` - Dashboard marker creation stays
- `app/src/app/api/transitioning/route.ts` - API endpoint stays
- `~/.claude/hooks/*` - Hooks are unrelated to this fix

## Execution Log

- 2026-01-28T14:37:42.027Z Work item created
- 2026-01-28T14:46:00.000Z Goals defined, success criteria added
- 2026-01-28T14:47:30.000Z Implementation plan created
- 2026-01-28T14:52:00.000Z Removed "Mark as Transitioning" section from all 4 skill files
- 2026-01-28T14:52:30.000Z Verified no "Mark as Transitioning" references remain in skills
- 2026-01-28T14:52:45.000Z Verified hooks unaffected (telegram, log-permission-request)
- 2026-01-28T14:53:00.000Z Build passed (npm run build)
- 2026-01-28T14:53:15.000Z All success criteria verified
- 2026-01-28T14:53:30.000Z Ready for /flywheel-done
- 2026-01-28T14:55:00.000Z Committed and pushed to main (988c7d9)
- 2026-01-28T14:55:30.000Z Work item completed
