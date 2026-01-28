# Add grouping to permissions page

## Metadata
- id: add-grouping-to-permissions-page-235
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: planned
- unattended: true
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session: 

## Description

Make the permissions page more user-friendly with two improvements:

1. **Permission Categories**: Group permission rules into collapsible categories:
   - File Operations (`Read`, `Edit`)
   - Git Commands (`Bash(git *)`)
   - Testing (`Bash(npm test:*)`, `Bash(pytest:*)`, `Bash(cargo test:*)`, `Bash(go test:*)`)
   - Build & Lint (`Bash(npm run build:*)`, `Bash(npx eslint:*)`, `Bash(prettier:*)`, etc.)
   - Package Management (`Bash(npm install:*)`, `Bash(pip install:*)`, `Bash(cargo add:*)`, `Bash(go get:*)`)
   - GitHub CLI (`Bash(gh *)`)
   - Flywheel Skills (`Skill(flywheel-*)`)
   - Other (everything else)

2. **Collapsible Area Columns**: Make each area (Bellwether, Sophia, Personal) a collapsible group:
   - When expanded: shows the area checkbox column + all project columns within that area
   - When collapsed: shows only the area checkbox column with a summary (e.g., "3 projects, 45 rules enabled")
   - Areas start collapsed by default
   - Visual distinction between areas (existing colors work well)

Use `/frontend-design` skill during execution for high design quality.

## Success Criteria

- [ ] Permission rules are grouped into categories (File Ops, Git, Testing, Build/Lint, Package Mgmt, GitHub CLI, Flywheel, Other)
- [ ] Categories are collapsible with expand/collapse toggle
- [ ] Each area column group (Bellwether, Sophia, Personal) is collapsible
- [ ] Collapsed areas show summary: project count and enabled rule count
- [ ] Areas start collapsed by default
- [ ] Expanding an area reveals the area checkbox + all project columns
- [ ] All existing functionality preserved (checkbox toggling, drift warnings, sync)
- [ ] No type errors
- [ ] No lint errors

## Notes

- Existing area colors: Bellwether=#3b82f6 (blue), Sophia=#f97316 (orange), Personal=#22c55e (green)
- The description mentions using /frontend-design during execution for polished UI

## Implementation Plan

### Phase 1: Add Permission Category Grouping (Row Grouping)

1. **Add category classification function**
   - File: `app/src/app/permissions/page.tsx`
   - Create `categorizeRule(rule: string)` function that returns category name based on patterns:
     - "File Operations": rules starting with `Read` or `Edit`
     - "Git Commands": `Bash(git *)`
     - "Testing": `Bash(npm test:*)`, `Bash(pytest:*)`, `Bash(cargo test:*)`, `Bash(go test:*)`, `Bash(npx jest:*)`
     - "Build & Lint": `Bash(npm run build:*)`, `Bash(npx tsc:*)`, `Bash(tsc:*)`, `Bash(npx next build:*)`, `Bash(cargo build:*)`, `Bash(go build:*)`, `Bash(npm run lint:*)`, `Bash(npx eslint:*)`, `Bash(eslint:*)`, `Bash(npx prettier:*)`, `Bash(prettier:*)`, `Bash(npm run format:*)`
     - "Package Management": `Bash(npm install:*)`, `Bash(npm ci:*)`, `Bash(npm i:*)`, `Bash(pip install:*)`, `Bash(cargo add:*)`, `Bash(go get:*)`
     - "GitHub CLI": `Bash(gh *)`
     - "Flywheel Skills": `Skill(flywheel-*)`
     - "Other": everything else
   - Verification: TypeScript compiles without errors

2. **Add category state management**
   - File: `app/src/app/permissions/page.tsx`
   - Add `expandedCategories` state (Set of category names) - initialize empty (all collapsed)
   - Add `toggleCategory(category: string)` function
   - Verification: TypeScript compiles without errors

3. **Group rules by category in render**
   - File: `app/src/app/permissions/page.tsx`
   - Create `groupedRules` computed variable that groups `permissions.allRules` by category
   - Maintain consistent category order: File Ops, Git, Testing, Build & Lint, Package Mgmt, GitHub CLI, Flywheel, Other
   - Verification: TypeScript compiles without errors

4. **Render category headers with collapse toggle**
   - File: `app/src/app/permissions/page.tsx`
   - Replace flat rule iteration with category-grouped rendering
   - Each category gets a header row with:
     - ChevronRight/ChevronDown icon (from lucide-react)
     - Category name
     - Rule count badge (e.g., "12 rules")
   - Click on header toggles category expansion
   - Rules only render when category is expanded
   - Verification: Visual check in browser

### Phase 2: Add Collapsible Area Columns

5. **Add area expansion state**
   - File: `app/src/app/permissions/page.tsx`
   - Add `expandedAreas` state (Set of area names) - initialize empty (all collapsed)
   - Add `toggleArea(area: string)` function
   - Verification: TypeScript compiles without errors

6. **Calculate area summaries**
   - File: `app/src/app/permissions/page.tsx`
   - For each area, calculate:
     - Project count
     - Total enabled rules count across all projects in area
   - Verification: TypeScript compiles without errors

7. **Update table header for collapsible areas**
   - File: `app/src/app/permissions/page.tsx`
   - Area header cell becomes clickable with chevron icon
   - When collapsed: show area name + summary ("3 projects · 45 enabled")
   - When expanded: show area header + project columns
   - Add visual separator/border between area groups
   - Verification: Visual check in browser

8. **Update table body for collapsible areas**
   - File: `app/src/app/permissions/page.tsx`
   - For each area:
     - Always render the area checkbox column (with border-left separator)
     - Only render project columns when area is expanded
   - Verification: Visual check in browser

### Phase 3: Polish & Verification

9. **Add visual refinements**
   - File: `app/src/app/permissions/page.tsx`
   - Smooth transitions for expand/collapse
   - Hover states on clickable headers
   - Consistent spacing and alignment
   - Category header row styling (subtle background, font weight)
   - Verification: Visual check in browser

10. **Run verification commands**
    - `cd app && npm run typecheck` — no type errors
    - `cd app && npm run lint` — no lint errors
    - `cd app && npm run build` — build succeeds
    - Verification: All commands pass

### Verification

- `cd app && npm run typecheck` -- no type errors
- `cd app && npm run lint` -- no lint errors
- `cd app && npm run build` -- build succeeds

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify page loads with "Permissions" heading
3. Verify rules are grouped into categories (look for category headers like "File Operations", "Git Commands", etc.)
4. Verify categories show rule count badges
5. Click on a collapsed category header → verify rules expand below it
6. Click again → verify rules collapse
7. Verify area columns (Bellwether, Sophia, Personal) are collapsed by default showing summary text
8. Click on Bellwether area header → verify project columns expand
9. Click again → verify project columns collapse and summary returns
10. Toggle a Global checkbox → verify it still works (saves to API)
11. Toggle an Area checkbox → verify it still works
12. If drift warning banner is visible, verify "Sync All" button still works

## Execution Log

- 2026-01-28T14:32:26.373Z Work item created
- 2026-01-28T14:38:00.000Z Goals defined, success criteria added
- 2026-01-28T14:42:00.000Z Implementation plan created
