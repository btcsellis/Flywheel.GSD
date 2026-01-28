# Sync global permissions to project settings files

## Metadata
- id: sync-global-permissions-to-project-settings
- project: personal/flywheel-gsd
- priority: high
- created: 2026-01-28
- status: done
- workflow: main

## Description

Claude Code's project-level `permissions.allow` overrides user-level permissions entirely (not merged). This means rules in `~/.claude-{area}/settings.local.json` are silently ignored for any project that has its own `.claude/settings.local.json` with a `permissions` block.

The dashboard already discovers projects and surfaces their permission rules. The missing piece: when area-level rules are set (in `~/.claude-{area}/settings.local.json`), those rules must be copied into every project-level `.claude/settings.local.json` that has a `permissions` block. This ensures flywheel operations and other global rules don't prompt unexpectedly in any project.

### Context

- Three settings levels: user (`$CLAUDE_CONFIG_DIR/settings.local.json`), project checked-in (`.claude/settings.json`), project local (`.claude/settings.local.json`)
- Project-level overrides user-level — no merge (known issue: anthropics/claude-code#17017, #5140)
- Steven uses `direnv` + `CLAUDE_CONFIG_DIR` to maintain per-area configs (`~/.claude-personal/`, `~/.claude-sophia/`, `~/.claude-bellwether/`)
- All area-level rules should be present in every project that has its own permissions block

## Success Criteria

- [x] When area-level rules are set/updated via the dashboard, they are written to all discovered project `.claude/settings.local.json` files (creating the permissions block if needed)
- [x] Existing project-specific rules are preserved (area rules are added, not replaced)
- [x] Duplicate rules are not created (if an area rule already exists in a project, it's not added again)
- [x] The sync covers all areas: `~/.claude/`, `~/.claude-personal/`, `~/.claude-sophia/`, `~/.claude-bellwether/`
- [x] Project-level permission checkboxes in the dashboard are enabled (not disabled) when a global/area rule exists — toggling them adds/removes the rule at the project level
- [x] All existing tests pass
- [x] No type errors

## Implementation Plan

### Phase 1: Backend — Cascade global/area rule writes to projects

**Goal:** When `writeGlobalRule()` or `writeAreaRule()` is called, also write the rule to all projects in the relevant area(s).

1. **Add `syncRuleToAreaProjects()` helper in `app/src/lib/permissions.ts`**
   - Takes `areaValue: string, rule: string, enabled: boolean`
   - Uses `discoverProjectsInArea()` from `projects.ts` to get all projects for that area
   - For each project, calls `writeProjectRule(projectPath, rule, enabled)`
   - Runs all writes in parallel via `Promise.all()`

2. **Update `writeAreaRule()` (line 589) to cascade to projects**
   - After writing the area settings file (line 620), call `syncRuleToAreaProjects(areaValue, rule, enabled)`
   - This means any area rule change propagates to all projects in that area

3. **`writeGlobalRule()` already calls `writeAreaRule()` for each area (line 664-666)**
   - No change needed here — since `writeAreaRule()` now cascades to projects, global changes automatically flow: global → areas → projects

4. **Verification:** Toggle a global rule in the dashboard, confirm it appears in a project's `.claude/settings.local.json`

### Phase 2: Frontend — Enable project checkboxes when parent rule exists

**Goal:** Project checkboxes should be interactive (not disabled) even when a global/area rule exists, so you can toggle the rule at the project level.

5. **Update `page.tsx` project checkbox (lines 479-494)**
   - Remove `isDisabledByParent` logic (line 479): `const isDisabledByParent = isGlobalEnabled || isAreaEnabled`
   - The checkbox should always be enabled — `disabled={false}`, remove `disabledChecked`
   - Since area rules now cascade to projects, the checkbox will already show as checked when a parent rule is set
   - Toggling it off will remove it from the project file (even if it's still in the area file)

6. **Update area checkbox disable logic (line 464)**
   - Same treatment: remove `disabled={isGlobalEnabled}` and `disabledChecked={isGlobalEnabled}`
   - Area checkboxes should be interactive even when global rule exists

7. **Verification:** Load dashboard, confirm project checkboxes are clickable for rules that have global/area parents

### Phase 3: Optimistic UI updates for cascading

8. **Update `toggleGlobalRule()` optimistic update (lines 127-148)**
   - In addition to updating `areaEnabled`, also update each project's `enabledRules` in the `projects` array
   - For each project, add/remove the rule from `enabledRules`

9. **Update `toggleAreaRule()` optimistic update (lines 188-193)**
   - Also update `enabledRules` for projects belonging to that area

10. **Verification:** Toggle global rule, confirm project checkboxes update immediately without page reload

### Verification

- `cd app && npm run typecheck` — no type errors
- `cd app && npm run lint` — no lint errors
- `cd app && npm run build` — build succeeds
- Manual: toggle a global rule, verify it appears in project `.claude/settings.local.json` files
- Manual: toggle a project checkbox when parent rule exists, verify it works

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify the permissions table loads with global, area, and project columns
3. Confirm project checkboxes are NOT disabled/grayed out when a global or area rule is checked
4. Toggle a global rule on — verify project checkboxes for that rule update to checked
5. Toggle a project checkbox off for a rule that has a global parent — verify it unchecks without error
6. Toggle it back on — verify it re-checks

## Notes

- The `/flywheel-permissions` skill may also need updating to write rules to project-level files, but that's a separate work item
- The dashboard already scans for projects and surfaces rules — this work item adds the write-back to project files
- Sync direction is one-way: area-level → project-level
- `writeAreaRule()` is the key choke point — both direct area toggles and global cascades flow through it

## Execution Log
- 2026-01-28T00:00:00.000Z Work item created
- 2026-01-28T13:50:00.000Z Goals defined, success criteria added
- 2026-01-28T14:10:00.000Z Implementation plan created
- 2026-01-28T14:15:00.000Z Phase 1: Added syncRuleToAreaProjects() helper, wired into writeAreaRule()
- 2026-01-28T14:16:00.000Z Phase 2: Removed disabled state from area and project checkboxes in page.tsx
- 2026-01-28T14:17:00.000Z Phase 3: Updated toggleGlobalRule() and toggleAreaRule() to cascade optimistic updates to projects
- 2026-01-28T14:18:00.000Z Exported discoverProjectsInArea() from projects.ts
- 2026-01-28T14:19:00.000Z TypeScript check passes (npx tsc --noEmit)
- 2026-01-28T14:20:00.000Z Build passes (npm run build)
- 2026-01-28T14:25:00.000Z Browser verification: project checkboxes are clickable, clicking updates project settings file
- 2026-01-28T14:26:00.000Z All success criteria verified, transitioning to review
- 2026-01-28T14:30:00.000Z Committed and pushed to main (6f939f9)
- 2026-01-28T14:30:00.000Z Work item completed
