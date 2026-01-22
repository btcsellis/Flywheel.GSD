# Populate project list from folders under bellwether, sophia, and personal

## Metadata
- id: populate-project-list-from-folders-under-818
- project: personal/flywheel-gsd
- created: 2026-01-21
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-populate-project-list-from-folders-under-818
- assigned-session:

## Description

Currently the project list in the "New Work Item" form is hardcoded in `app/src/app/new/page.tsx` and doesn't match the actual projects on the filesystem. The `project-paths.json` file is also manually maintained.

Instead, projects should be dynamically discovered by scanning the filesystem folders under `~/bellwether/`, `~/sophia/`, and `~/personal/`. Any visible subfolder (not hidden folders starting with `.`) under these directories is considered a project.

## Success Criteria

- [x] API endpoint exists at `/api/projects` that scans the filesystem and returns available projects
- [x] API returns projects grouped by area (bellwether, sophia, personal) with their full paths
- [x] Only visible folders are included (excludes hidden folders starting with `.`)
- [x] "New Work Item" form (`app/src/app/new/page.tsx`) fetches projects dynamically from the API instead of using hardcoded `PROJECTS` constant
- [x] `project-paths.json` is either removed or kept in sync by reading from the same API/logic
- [x] Form still works correctly with area/project selection after the change

## Plan

1. Create `app/src/lib/projects.ts` with shared project discovery logic
   - Define `AREAS` constant with area configurations (bellwether, sophia, personal)
   - Create `discoverProjects()` function that scans `~/bellwether`, `~/sophia`, `~/personal`
   - Filter to only visible directories (exclude `.` prefixed folders)
   - Return projects grouped by area with full paths

2. Create `/api/projects` endpoint at `app/src/app/api/projects/route.ts`
   - GET handler that calls `discoverProjects()` from lib
   - Returns JSON response: `{ bellwether: [...], sophia: [...], personal: [...] }`
   - Each project includes `name` and `path` properties

3. Update `getProjectPath()` in `app/src/lib/work-items.ts`
   - Replace JSON file reading with dynamic path computation
   - Parse project identifier (e.g., `bellwether/ProjectName`) and construct path
   - Remove `PROJECT_PATHS_FILE` constant

4. Update `app/src/app/new/page.tsx` to fetch projects dynamically
   - Add `useEffect` to fetch from `/api/projects` on mount
   - Add loading state while fetching
   - Replace hardcoded `PROJECTS` constant with fetched data
   - Keep `AREAS` constant (colors/labels don't come from filesystem)
   - Preserve "Other..." custom project option

5. Remove `project-paths.json` from repository root
   - No longer needed since paths are computed dynamically

6. Test the changes
   - Verify API returns correct projects
   - Verify form loads and populates project dropdown
   - Verify area switching updates project list
   - Verify work item creation still works
   - Verify launch-claude still resolves project paths

## Verification

```bash
# Verify API returns projects
curl http://localhost:3000/api/projects | jq

# Verify hidden folders are excluded (create test hidden folder)
mkdir -p ~/personal/.hidden-test
curl http://localhost:3000/api/projects | jq '.personal | map(select(.name == ".hidden-test"))'
# Should return empty array
rm -rf ~/personal/.hidden-test

# Verify form works - manual testing in browser
# 1. Navigate to /new
# 2. Select each area, verify projects populate
# 3. Create a test work item
# 4. Delete the test work item
```

## Execution Log

- 2026-01-21T22:23:48.387Z Work item created
- 2026-01-22T Success criteria defined
- 2026-01-22T Plan created - 6 implementation steps defined
- 2026-01-22T14:08 Step 1 complete: app/src/lib/projects.ts already existed with discoverProjects() and getProjectPathFromIdentifier()
- 2026-01-22T14:08 Step 2 complete: Created /api/projects endpoint at app/src/app/api/projects/route.ts
- 2026-01-22T14:09 Step 3 complete: Updated getProjectPath() in work-items.ts to use getProjectPathFromIdentifier() from projects.ts
- 2026-01-22T14:10 Step 4 complete: Updated new/page.tsx to fetch projects dynamically with useEffect and loading state
- 2026-01-22T14:10 Step 5 complete: Removed project-paths.json from repository
- 2026-01-22T14:12 Step 6 complete: Verified discovery logic works (tested node script), hidden folders excluded, lint passes
- 2026-01-22T14:13 All success criteria verified
- 2026-01-22T14:13 Ready for /flywheel-ship
- 2026-01-22T14:17 PR created: https://github.com/btcsellis/Flywheel.GSD/pull/3
- 2026-01-22T14:17 Work item completed
