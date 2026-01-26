# Permissions Management: Show All Existing Permissions

## Metadata
- id: permissions-show-all-existing-804
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: done
- tmux-session: flywheel-gsd
- workflow: worktree
- assigned-session:

## Description

Update the permissions management system to display all permissions that exist in settings files, including ones that aren't part of the 14 predefined categories.

**Problem:** The current system only shows category-based permissions. Any rule manually added to `settings.json` (e.g., `Bash(custom-script)`) that doesn't fit a category is invisible in the dashboard.

**Solution:** Add a section to show all individual permission rules from settings files, with:
- Parsed/friendly display (tool name + pattern)
- Raw rule string
- Source file indicator (global vs project)
- Deduplication: rules defined globally don't repeat at project level unless overridden

**Hierarchy:**
- **Global** (upstream): `~/.claude/settings.json`
- **Project** (downstream): `.claude/settings.json` in project root

**Override logic:** A rule at project level is shown as an override if the same tool exists at global level with a different pattern.

## Success Criteria

- [x] New section in dashboard shows all individual permission rules (not just categories)
- [x] Each rule displays: parsed format (tool + pattern), raw string, source (global/project)
- [x] Rules defined at global level are not duplicated at project level
- [x] Override rules (same tool, different pattern) are shown with indicator
- [x] Custom/untracked rules (not part of any category) are clearly marked
- [x] All tests pass
- [x] No type errors

## Notes

This is a prerequisite for the permission collection hook work item - we need to be able to see all permissions before we can effectively manage adding new ones.

**Current system limitations discovered:**
- Only reads global + project settings (not `.claude/settings.local.json`)
- Category-based model: 14 categories map to specific rules
- Rules outside categories are invisible in the UI
- No individual rule visibility

**Key files:**
- `/app/src/lib/permissions.ts` - Core permission logic, categories
- `/app/src/app/permissions/page.tsx` - Dashboard UI
- `/app/src/app/api/permissions/route.ts` - API endpoints

## Implementation Plan

### Phase 1: Extend Permission Types and Data Structures

1. **Add new types in `permissions.ts`**
   - Create `ParsedRule` interface: `{ tool: string; pattern: string | null; raw: string }`
   - Create `RuleWithSource` interface: `{ rule: ParsedRule; source: 'global' | 'project'; isOverride: boolean; isCustom: boolean }`
   - Create `AllRulesState` interface to hold raw rules from both sources
   - Files: `/app/src/lib/permissions.ts`
   - Verification: TypeScript compiles without errors

2. **Create rule parsing utility function**
   - `parseRule(raw: string): ParsedRule` - extracts tool name and pattern from rule strings
   - Handles formats: `Tool`, `Tool(pattern)`, `Tool(pattern:*)`, `mcp__*`
   - Files: `/app/src/lib/permissions.ts`
   - Verification: Function handles all rule formats in existing `PERMISSION_CATEGORIES`

3. **Create function to get all raw rules from settings**
   - `readAllRawRules(): Promise<AllRulesState>` - reads `permissions.allow` arrays directly
   - Returns `{ globalRules: string[], projectRules: Map<projectPath, string[]> }`
   - Files: `/app/src/lib/permissions.ts`
   - Verification: Returns actual rule strings from settings files

### Phase 2: Build Rule Analysis Logic

4. **Create function to identify custom/untracked rules**
   - `isRuleInCategory(rule: string): string | null` - returns category ID or null if untracked
   - Checks if rule matches any rule in `PERMISSION_CATEGORIES`
   - Files: `/app/src/lib/permissions.ts`
   - Verification: Correctly identifies `Read`, `Edit` as categorized; custom rules as untracked

5. **Create function to compute rule display list**
   - `computeRuleDisplayList(globalRules: string[], projectRules: string[]): RuleWithSource[]`
   - Applies deduplication: project rules matching global rules show global source only
   - Detects overrides: same tool at project level with different pattern
   - Marks custom rules: rules not in any category
   - Files: `/app/src/lib/permissions.ts`
   - Verification: Returns correctly annotated list with deduplication

### Phase 3: API Enhancement

6. **Add new API endpoint for raw rules**
   - Create `/api/permissions/rules/route.ts`
   - GET returns `{ globalRules: RuleWithSource[], projectRules: { [path]: RuleWithSource[] } }`
   - Uses functions from Phase 1-2
   - Files: `/app/src/app/api/permissions/rules/route.ts`
   - Verification: API returns parsed rule data with correct annotations

### Phase 4: UI Components

7. **Create `RulesList` component**
   - Displays list of rules with: parsed format, raw string, source badge, override/custom indicators
   - Uses existing `Badge` component for source/status indicators
   - Collapsible or scrollable if list is long
   - Files: `/app/src/app/permissions/components/rules-list.tsx`
   - Verification: Component renders rules with all metadata visible

8. **Add "All Rules" section to permissions page**
   - Add new section below existing global permissions
   - Fetch from `/api/permissions/rules`
   - Show global rules section
   - Show per-project rules sections (grouped by area like existing UI)
   - Files: `/app/src/app/permissions/page.tsx`
   - Verification: New section visible on page with rule data

### Phase 5: Testing and Polish

9. **Verify all success criteria**
   - Run `npm run build` - no errors
   - Run `npm run lint` - no errors
   - Manual verification of UI functionality
   - Files: N/A
   - Verification: All commands pass, UI shows expected data

### Verification

- `cd app && npm run build` passes
- `cd app && npm run lint` passes
- Dashboard shows new "All Rules" section
- Global rules display with parsed format and source indicator
- Project rules show override indicators where applicable
- Custom rules (not in categories) clearly marked
- No duplicate rules between global and project when same rule exists in both

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify "Global Permissions" section is visible (existing)
3. Scroll down to verify new "All Rules" section exists
4. Verify global rules are displayed with:
   - Parsed format (e.g., "Bash" + "git status")
   - Raw rule string shown
   - "Global" source badge
5. Verify any custom rules (not matching categories) have "Custom" indicator
6. If project has rules, verify project section shows:
   - Rules with "Project" source badge
   - Override indicator for rules that override global rules
7. Verify global rules are not duplicated in project section

## Execution Log

- 2026-01-26T14:10:00Z Work item created
- 2026-01-26 Goals defined after clarifying hierarchy and override behavior
- 2026-01-26 Implementation plan created
- 2026-01-26 08:55 Phase 1-4 complete: Added types, parsing, API endpoint, and UI component
- 2026-01-26 09:00 Build passes, lint passes (0 errors, 6 pre-existing warnings)
- 2026-01-26 09:02 API verification: /api/permissions/rules returns correct data with parsing, deduplication, override detection, and custom rule marking
- 2026-01-26 09:05 All success criteria verified
- 2026-01-26 09:05 Ready for /flywheel-done
- 2026-01-26 09:10 Committed and pushed (1ec38a5)
- 2026-01-26 09:10 PR created: https://github.com/btcsellis/Flywheel.GSD/pull/7
- 2026-01-26 09:10 Work item completed
