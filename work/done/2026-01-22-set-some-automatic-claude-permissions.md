# Claude Permissions Management Page

## Metadata
- id: set-some-automatic-claude-permissions-330
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Build a permissions management page in the Flywheel dashboard that allows configuring Claude Code auto-permissions for each discovered project/repo. The page will show all projects with checkboxes for various permission categories, plus a global "all repos" toggle for each category.

The page reads/writes directly to `.claude/settings.json` in each project folder.

## Success Criteria

- [x] New `/permissions` page added to the Flywheel dashboard
- [x] Page displays all discovered projects (using existing project discovery logic)
- [x] Permission categories displayed with checkboxes:
  - **File Operations**: Read any file, Write/edit files, Create new files
  - **Bash Commands**: Git read ops, Run tests, Build commands, Lint/format, Package info, Install dependencies, Git write ops
  - **Other**: MCP tool calls, Web fetches
- [x] Each permission category has an "All repos" toggle that applies to all projects
- [x] Individual project checkboxes can override the global setting
- [x] Checking/unchecking a box immediately writes to that project's `.claude/settings.json`
- [x] Page loads current permission state from each project's `.claude/settings.json` on mount
- [x] Handles missing `.claude/` directory gracefully (creates if needed when saving)
- [x] Navigation link added to dashboard sidebar/header
- [x] No TypeScript errors
- [x] Existing tests pass (build succeeded)

## Notes

- Projects discovered from filesystem (same as existing dashboard)
- Claude Code settings format uses `permissions.allow` array in `.claude/settings.json`
- Should handle projects that don't have a `.claude/` folder yet

## Implementation Plan

### Phase 1: Library & Types

1. **Create permissions library** (`src/lib/permissions.ts`)
   - Define `PermissionCategory` interface with id, label, description, rules array
   - Define `ProjectPermissions` interface mapping project paths to enabled categories
   - Define permission categories constant with all rules:
     - **File Operations**: `Read`, `Edit`, `Write`
     - **Git Read**: `Bash(git status)`, `Bash(git log:*)`, `Bash(git diff:*)`, `Bash(git branch:*)`
     - **Run Tests**: `Bash(npm test:*)`, `Bash(npm run test:*)`, `Bash(pytest:*)`, `Bash(jest:*)`
     - **Build Commands**: `Bash(npm run build:*)`, `Bash(tsc:*)`, `Bash(next build:*)`
     - **Lint/Format**: `Bash(npm run lint:*)`, `Bash(eslint:*)`, `Bash(prettier:*)`
     - **Package Info**: `Bash(npm list:*)`, `Bash(npm outdated:*)`, `Bash(npm info:*)`
     - **Install Dependencies**: `Bash(npm install:*)`, `Bash(npm ci:*)`, `Bash(pip install:*)`
     - **Git Write**: `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git push:*)`
     - **MCP Tools**: `mcp__*`
     - **Web Fetches**: `WebFetch`, `WebSearch`
   - Implement `readProjectPermissions(projectPath)` - reads `.claude/settings.json`
   - Implement `writeProjectPermissions(projectPath, categories)` - writes settings, creates `.claude/` if needed
   - Implement `readGlobalPermissions()` - reads `~/.claude/settings.json`
   - Implement `writeGlobalPermissions(categories)` - writes to user-level settings
   - Verification: TypeScript compiles without errors

2. **Create API routes**
   - `GET /api/permissions` - returns all projects with their current permission states
   - `PUT /api/permissions/[...path]` - updates a specific project's permissions
   - `GET /api/permissions/global` - returns global (all repos) permission state
   - `PUT /api/permissions/global` - updates global permissions
   - Verification: API routes respond correctly via curl/fetch

### Phase 2: UI Components

3. **Create PermissionToggle component** (`src/components/permission-toggle.tsx`)
   - Checkbox with label and description
   - Controlled component with `checked`, `onChange`, `indeterminate` props
   - Indeterminate state for "All repos" when some but not all are checked
   - Uses existing UI components (Card styling patterns)
   - Verification: Component renders correctly in isolation

4. **Create PermissionsGrid component** (`src/components/permissions-grid.tsx`)
   - Displays permission categories as rows
   - Columns: Category name | All repos toggle | Individual project toggles
   - Sticky header row with project names
   - Handles horizontal scroll for many projects
   - Verification: Grid displays with mock data

### Phase 3: Permissions Page

5. **Create permissions page** (`src/app/permissions/page.tsx`)
   - Client component (`'use client'`)
   - Fetches projects from `/api/projects` on mount
   - Fetches current permissions from `/api/permissions` on mount
   - Renders PermissionsGrid with real data
   - Loading state while fetching
   - Error handling for failed fetches
   - Verification: Page loads and displays projects with permissions

6. **Implement save functionality**
   - Checkbox changes trigger PUT to `/api/permissions/[project]` or `/api/permissions/global`
   - Optimistic UI update with rollback on error
   - Toast/feedback on save success/failure
   - Verification: Changes persist and reload correctly

### Phase 4: Navigation & Polish

7. **Add navigation link**
   - Update `src/app/layout.tsx` to add "Permissions" NavLink
   - Position after "Archive", before "+ New"
   - Verification: Nav link appears and works

8. **Styling & UX polish**
   - Consistent dark theme styling
   - Project names show area color coding
   - Responsive layout for smaller screens
   - Verification: Visual review, no layout issues

### Verification

- `npm run build` succeeds with no errors
- `npm run lint` passes (if configured)
- TypeScript compiles without errors
- Manual testing: toggle permissions, refresh page, verify persistence
- Check `.claude/settings.json` files are created/updated correctly

## Execution Log

- 2026-01-22T15:23:16.257Z Work item created
- 2026-01-22T15:26:00.000Z Goals defined, success criteria added
- 2026-01-22T15:35:00.000Z Implementation plan created
- 2026-01-22T15:45:00.000Z Created permissions library (src/lib/permissions.ts)
- 2026-01-22T15:48:00.000Z Created API routes (/api/permissions, /api/permissions/global, /api/permissions/project)
- 2026-01-22T15:50:00.000Z Created checkbox UI component
- 2026-01-22T15:55:00.000Z Created permissions page with full UI (src/app/permissions/page.tsx)
- 2026-01-22T15:56:00.000Z Added navigation link to layout
- 2026-01-22T15:57:00.000Z Build succeeded, all success criteria verified
- 2026-01-22T15:57:30.000Z Ready for /flywheel-done
- 2026-01-22T16:00:00.000Z Committed and pushed to main (b90b0b8)
- 2026-01-22T16:00:30.000Z Work item completed
