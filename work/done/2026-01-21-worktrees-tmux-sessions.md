# Worktrees / tmux sessions

## Metadata
- id: worktrees-tmux-sessions-183
- project: personal/flywheel-gsd
- created: 2026-01-21
- status: done
- assigned-session: 

## Description

When calling Claude Code, let's either use the main git branch, which would use a tmux session for that project, or create a worktree, which would create a new tmux session. This question is really only relevant when going from new to defined. After that, it will just keep using the same tmux session. Subsequent steps should handle things gracefully (finding and using the right tmux pane, or starting a new one with the right session, handling git properly, cleaning up the right things.) If we start in main, no need to create a branch and issue a pr on ship. just commit and sync.

## Success Criteria

### Workflow Selection (new → defined)
- [x] User is prompted to choose: "main branch" or "new worktree"
- [x] Choice is stored in work item metadata (new field: `workflow: main | worktree`)
- [x] Replaces the existing "existing or new session" prompt

### Worktree Flow
- [x] Creates git worktree at `../{repo}-worktrees/{work-item-id}/`
- [x] Creates branch named after work item ID
- [x] Creates tmux session named `flywheel-{project}-{work-item-id}`
- [x] On ship: commit, push, create PR
- [x] On cleanup: delete worktree directory and delete branch

### Main Branch Flow
- [x] Uses existing project tmux session (named `{project}`)
- [x] No branch creation needed
- [x] On ship: commit and sync (push to main), no PR
- [x] On cleanup: archive work item only

### Terminal/Tmux Handling (all subsequent steps)
- [x] If terminal is attached to correct tmux session → use existing pane
- [x] Otherwise → horizontal split current terminal, start Claude Code in new pane with correct session
- [x] Session name persisted in work item for subsequent steps to find

### Cross-Project Support
- [x] Works for any project flywheel manages (bellwether, sophia, flywheel-gsd, etc.)
- [x] Worktree paths relative to each project's repo location

## Implementation Plan

### Phase 1: Schema Updates

**Step 1: Update work item metadata schema**
- Add `workflow: main | worktree` field to work item metadata
- Add `tmux-session: string` field to store the session name for subsequent steps
- Update `app/src/lib/work-items.ts` to include new fields in WorkItem type

### Phase 2: Workflow Selection (new → defined transition)

**Step 2: Update prompts.ts for workflow selection**
- Modify the `new` status prompt in `app/src/lib/prompts.ts`
- Add instruction for Claude to ask: "Main branch or new worktree?"
- Store choice in `workflow` metadata field

**Step 3: Update terminal.ts for worktree creation**
- Add `createWorktree()` function that:
  - Creates worktree at `../{repo}-worktrees/{work-item-id}/`
  - Creates branch named `{work-item-id}`
  - Returns the worktree path
- Add `deleteWorktree()` function for cleanup
- Update `LaunchConfig` interface to include `workflow` type

**Step 4: Update launch-claude API route**
- Pass workflow type to terminal functions
- When `workflow: worktree`:
  - Call `createWorktree()` to set up worktree
  - Launch in worktree directory instead of main project directory
  - Set tmux session name to `flywheel-{project}-{work-item-id}`
- When `workflow: main`:
  - Use existing project directory
  - Set tmux session name to just `{project}` (e.g., `bellwether-DataAnalysis`)

### Phase 3: Session Persistence & Lookup

**Step 5: Session detection in terminal.ts**
- Add `getCurrentTmuxSession()` function to detect if we're already in a tmux session
- Add `findWorkItemSession()` function to look up session name from work item metadata
- Modify launch logic:
  - If current terminal is in correct session → send keys to existing pane
  - Otherwise → horizontal split current terminal, attach to correct session

**Step 6: Persist session name in work item**
- After launching, write `tmux-session` to work item metadata
- Subsequent launches read this to find the right session

### Phase 4: Update Flywheel Skills

**Step 7: Update flywheel-ship.md**
- Read `workflow` field from work item metadata
- If `workflow: main`:
  - Skip branch check (allow committing on main)
  - Commit and push directly to main
  - Skip PR creation
  - Report: "Shipped to main (no PR)"
- If `workflow: worktree` (or unset for backwards compatibility):
  - Current behavior: create PR

**Step 8: Update flywheel-cleanup.md**
- Read `workflow` field from work item metadata
- If `workflow: main`:
  - Just archive work item
  - Delete PLAN.md if present
  - Skip worktree/branch deletion
- If `workflow: worktree`:
  - Current behavior: delete worktree and branch
- Add tmux session cleanup (kill session if no longer needed)

**Step 9: Update flywheel-start.md**
- After work item selection, check `workflow` field
- If unset (new item), proceed to defined → plan will ask for workflow
- If set, use existing workflow (for resuming work)

### Phase 5: Dashboard UI Updates

**Step 10: Update launch button component**
- For `new` status items, add workflow selector before launching
- Options: "Main Branch" or "New Worktree"
- Pass selection to launch-claude API
- Store in work item before launching

**Step 11: Display workflow type in work item views**
- Show workflow type badge on work item cards/detail pages
- Show tmux session name for debugging

### Testing Scenarios

1. **New → Defined with Main branch:**
   - Launch from dashboard, select "Main branch"
   - Verify: works in main project directory
   - Verify: tmux session named `{project}`

2. **New → Defined with Worktree:**
   - Launch from dashboard, select "New worktree"
   - Verify: worktree created at correct path
   - Verify: branch created with work item ID
   - Verify: tmux session named `flywheel-{project}-{work-item-id}`

3. **Subsequent steps find existing session:**
   - Launch planned item that has tmux-session set
   - Verify: uses existing session, horizontal split if needed

4. **Ship with Main branch:**
   - Verify: commits to main, syncs, no PR

5. **Ship with Worktree:**
   - Verify: creates PR (existing behavior)

6. **Cleanup with Main branch:**
   - Verify: archives only, no worktree deletion

7. **Cleanup with Worktree:**
   - Verify: deletes worktree and branch

## Execution Log

- 2026-01-21T22:18:20.518Z Work item created
- 2026-01-21 Work item defined with success criteria
- 2026-01-21 Implementation plan created
- 2026-01-21 Execution started
- 2026-01-21 Step 1: Added workflow and tmuxSession fields to WorkItemMetadata
- 2026-01-21 Step 2: Updated prompts.ts to pass workflow to generatePromptForStatus
- 2026-01-21 Step 3: Added createWorktree, deleteWorktree, generateTmuxSessionName to terminal.ts
- 2026-01-21 Step 4: Updated launch-claude API to handle workflow selection and persist metadata
- 2026-01-21 Step 5-6: Added session detection and persistence in terminal.ts and API
- 2026-01-21 Step 7: Updated flywheel-ship.md with main/worktree conditional logic
- 2026-01-21 Step 8: Updated flywheel-cleanup.md with main/worktree conditional logic
- 2026-01-21 Step 9: Updated flywheel-start.md to be workflow-aware
- 2026-01-21 Step 10: Updated launch-button.tsx with workflow selection UI
- 2026-01-21 Step 11: Added workflow badges to page.tsx and work-item-detail.tsx
- 2026-01-21 Build verified - all TypeScript compiles successfully
- 2026-01-21 All success criteria verified
- 2026-01-21 Ready for /flywheel-ship
- 2026-01-22 Committed and pushed to main (95ef17d)
- 2026-01-22 Work item completed
