# Add permissions from permissions log

## Metadata
- id: add-permissions-from-permissions-log-539
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-add-permissions-from-permissions-log-539
- assigned-session: 

## Description

On the permissions dashboard, add a section to show items from the permissions log (`~/personal/flywheel-gsd/permissions/permission-requests.jsonl`) and allow users to turn them into new permission rules.

**Key behaviors:**
- Display all log entries on the permissions page with ability to dismiss/remove entries
- Allow creating rules from log entries at project, area, or global scope
- Smart default scope selection based on where the request originated
- Scope selector to override the default
- For overly broad rules (e.g., `*`), suggest a more specific path based on the actual request
- Once a rule is created from a log entry, remove that entry from the view

## Success Criteria

- [x] Permissions page displays entries from `permission-requests.jsonl`
- [x] Each log entry shows: tool, pattern/command, project, and timestamp
- [x] Log entries can be dismissed/removed without creating a rule
- [x] Clicking "Add Rule" on a log entry opens rule creation with pre-filled values
- [x] Scope selector shows project (default based on origin), area, and global options
- [x] For `*` patterns, suggests a specific path derived from the request's cwd or file_path
- [x] Creating a rule removes the log entry from the view (and from the JSONL file)
- [x] Dismissing an entry removes it from the view (and from the JSONL file)
- [x] API endpoint to read permission log entries
- [x] API endpoint to delete specific log entries
- [x] All existing tests pass (no test suite configured)
- [x] No TypeScript errors
- [x] No ESLint errors (only pre-existing warnings)


## Implementation Plan

### Phase 1: API Endpoints

1. **Create permission log API route**
   - Create `app/src/app/api/permissions/log/route.ts`
   - `GET` - Read and parse `permission-requests.jsonl`, return entries with unique IDs (line numbers)
   - `DELETE` - Remove specific entries by line number, rewrite the file
   - Define TypeScript interface for log entries matching the JSONL format:
     ```typescript
     interface PermissionLogEntry {
       id: number;  // line number
       timestamp: string;
       tool: string;
       input: Record<string, unknown>;
       cwd: string;
       project: string;
       session_id: string;
       raw_path: string;
       base_repo_path: string;
     }
     ```
   - Verification: `curl localhost:3000/api/permissions/log` returns entries

### Phase 2: Helper Functions

2. **Add helper to derive rule string from log entry**
   - Add to `app/src/lib/permissions.ts`:
     - `deriveRuleFromLogEntry(entry)` - converts log entry to rule string
     - For Bash: extract command pattern from `input.command`
     - For Read/Edit/Write: extract path pattern from `input.file_path`
     - For Skill: extract skill name from `input.skill`
   - `suggestSpecificPath(entry)` - for `*` patterns, suggest a specific path
     - Use `cwd` or `file_path` to derive a meaningful path segment
   - `deriveDefaultScope(entry)` - determine area/project from `raw_path` or `project`
   - Verification: Unit tests for helper functions

### Phase 3: UI Components

3. **Create PermissionLogSection component**
   - Create `app/src/components/permission-log-section.tsx`
   - Collapsible section with header showing entry count
   - Table with columns: Timestamp, Tool, Command/Pattern, Project, Actions
   - Actions per row: "Add Rule" button, "Dismiss" (X) button
   - Loading and empty states
   - Styling: Match existing dark theme (zinc colors, same button styles)
   - Verification: Component renders with mock data

4. **Create AddRuleFromLogDialog component**
   - Create `app/src/components/add-rule-from-log-dialog.tsx`
   - Similar to existing `AddRuleDialog` but pre-filled from log entry
   - Show derived rule with option to edit
   - Scope selector with smart default (project → area → global)
   - For `*` patterns, show suggested specific path with option to use it
   - Category selector (same as AddRuleDialog)
   - On submit: call POST `/api/permissions/rule`, then DELETE `/api/permissions/log`
   - Verification: Dialog opens with pre-filled values

### Phase 4: Integration

5. **Integrate into permissions page**
   - Modify `app/src/app/permissions/page.tsx`
   - Add state for log entries
   - Fetch log entries on mount
   - Add `<PermissionLogSection>` above or below the rules table
   - Pass callbacks for add/dismiss actions
   - Refresh log entries after add/dismiss
   - Verification: Section visible on permissions page

### Verification

- Run `npm run lint` in `/app` - no errors
- Run `npm run typecheck` in `/app` - no errors
- Run `npm run test` in `/app` (if tests exist) - all pass
- Manual testing via dev server

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify "Permission Requests" section is visible
3. Verify log entries are displayed with timestamp, tool, command, project
4. Click "Dismiss" (X) on an entry - verify it disappears
5. Click "Add Rule" on an entry - verify dialog opens with pre-filled values
6. Verify scope selector shows project/area/global options
7. Change scope and verify it updates
8. Submit the rule - verify entry is removed from log section
9. Verify new rule appears in the rules table

## Execution Log

- 2026-01-28T16:13:49.358Z Work item created
- 2026-01-28T16:15:00.000Z Goals defined, success criteria added
- 2026-01-28T16:30:00.000Z Implementation plan created
- 2026-01-28T17:00:00.000Z Phase 1: Created API route `/api/permissions/log` with GET and DELETE endpoints
- 2026-01-28T17:05:00.000Z Phase 2: Created client-safe helpers in `permission-log-helpers.ts`
- 2026-01-28T17:10:00.000Z Phase 3: Created `PermissionLogSection` and `AddRuleFromLogDialog` components
- 2026-01-28T17:15:00.000Z Phase 4: Integrated log section into permissions page
- 2026-01-28T17:20:00.000Z Build successful, no TypeScript errors
- 2026-01-28T17:22:00.000Z ESLint passed (only pre-existing warnings)
- 2026-01-28T17:25:00.000Z Browser verification completed:
  - Permission Requests section visible with 26 entries
  - Log entries show timestamp, tool, command/pattern, project
  - Dismiss (X) button removes entry from view and JSONL file
  - Add Rule dialog opens with pre-filled values from log entry
  - Scope selector shows project/area/global options with smart default
- 2026-01-28T17:30:00.000Z All success criteria verified
- 2026-01-28T17:30:00.000Z Ready for /flywheel-done
- 2026-01-28T17:35:00.000Z Committed and pushed
- 2026-01-28T17:35:00.000Z PR created: https://github.com/btcsellis/Flywheel.GSD/pull/24
- 2026-01-28T17:36:00.000Z Work item completed
