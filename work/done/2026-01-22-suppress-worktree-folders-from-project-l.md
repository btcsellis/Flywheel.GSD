# Suppress -worktree folders from project list

## Metadata
- id: suppress-worktree-folders-from-project-l-657
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Worktree folders (directories ending in `-worktree`) are showing up as separate projects in the dashboard dropdown and permissions page. These should be completely hidden since they are temporary working directories, not actual projects.

## Success Criteria

- [x] Projects ending in `-worktree` are not shown in the project dropdown
- [x] Projects ending in `-worktree` are not shown on the permissions page
- [x] Regular projects still appear correctly
- [x] No type errors
- [x] Build passes

## Implementation Plan

### Phase 1: Filter worktree directories

1. **Update discoverProjectsInArea filter**
   - File: `app/src/lib/projects.ts`
   - Add filter condition to exclude directories ending in `-worktree`
   - Current filter on line 50: `.filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))`
   - New filter: `.filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.endsWith('-worktree'))`
   - Verification: Build passes, check `/api/projects` response

### Verification

- Run `npm run build` to verify no type errors
- Check project dropdown in dashboard - should not show worktree folders
- Check permissions page - should not show worktree folders

## Execution Log

- 2026-01-22T16:14:46.370Z Work item created
- 2026-01-22T16:35:00.000Z Goals defined, success criteria added
- 2026-01-22T16:38:00.000Z Implementation plan created
- 2026-01-22T16:40:00.000Z Added worktree filter to discoverProjectsInArea
- 2026-01-22T16:40:30.000Z Build verified - no type errors
- 2026-01-22T16:41:00.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-22T16:45:00.000Z Committed and pushed to main
- 2026-01-22T16:45:30.000Z Work item completed
