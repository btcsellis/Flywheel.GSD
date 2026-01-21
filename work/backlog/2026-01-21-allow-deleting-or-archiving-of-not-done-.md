# Allow deleting work items

## Metadata
- id: allow-deleting-or-archiving-of-not-done--270
- project: personal/flywheel-gsd
- created: 2026-01-21
- status: review
- assigned-session:

## Description

Add the ability to permanently delete work items that are no longer needed. When a work item is deleted, all associated resources should be cleaned up: prompt files, tmux sessions, and any generated plan files.

## Success Criteria

- [x] DELETE endpoint added to API (`/api/work-items/[folder]/[filename]`)
- [x] Delete button available on work item detail page (all non-done statuses)
- [x] Confirmation dialog shown before deletion
- [x] On delete, removes the work item markdown file
- [x] On delete, removes associated `.flywheel-prompt-*` files from project directory
- [x] On delete, kills any associated tmux session (if running)
- [x] On delete, removes any PLAN.md file created in target project
- [x] Dashboard refreshes/redirects appropriately after deletion

## Plan

1. **Add `deleteWorkItem()` to work-items.ts** - Simple function that removes the work item markdown file using `fs.unlink()`. Takes folder and filename parameters, returns boolean success.

2. **Add `killTmuxSession()` to terminal.ts** - Export new function that kills a tmux session by name using `tmux kill-session -t "sessionName"`. Silently handles non-existent sessions.

3. **Add `cleanupWorkItemResources()` to work-items.ts** - Function that cleans up associated resources:
   - Takes the work item as parameter
   - Uses `getProjectPath()` to resolve project directory
   - Deletes `.flywheel-prompt-{id}.txt` from project directory (glob pattern for partial matches)
   - Calls `killTmuxSession()` for `flywheel-{id}` session
   - Deletes `PLAN.md` from project directory if it exists
   - All operations are best-effort (don't fail if resources don't exist)

4. **Add DELETE handler to API route** (`/api/work-items/[folder]/[filename]/route.ts`):
   - Validate folder parameter
   - Load work item to get metadata (id, project)
   - Call `cleanupWorkItemResources(workItem)`
   - Call `deleteWorkItem(folder, filename)`
   - Return success/error JSON response

5. **Add delete button to work-item-detail.tsx**:
   - Add `deleting` state and `showDeleteDialog` state
   - Add confirmation dialog component (modal with cancel/confirm)
   - Add red "Delete" button in Actions section (only for non-done items)
   - On confirm: POST DELETE to API, then `router.push('/')` to redirect

6. **Test the feature**:
   - Create a test work item
   - Launch Claude on it (creates prompt file and tmux session)
   - Delete via UI
   - Verify: work item file gone, prompt file gone, tmux session killed

## Execution Log

- 2026-01-21T22:06:15.482Z Work item created
- 2026-01-21T22:15:00.000Z Defined success criteria with Steven
- 2026-01-21T23:10:00.000Z Plan created
- 2026-01-21T23:45:00.000Z Implemented deleteWorkItem() in work-items.ts
- 2026-01-21T23:46:00.000Z Implemented killTmuxSession() in terminal.ts
- 2026-01-21T23:47:00.000Z Implemented cleanupWorkItemResources() in work-items.ts
- 2026-01-21T23:48:00.000Z Added DELETE handler to API route
- 2026-01-21T23:50:00.000Z Added delete button with confirmation dialog to work-item-detail.tsx
- 2026-01-21T23:52:00.000Z Build passed successfully
- 2026-01-21T23:53:00.000Z All success criteria verified - ready for /flywheel-ship
