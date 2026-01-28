# Make it easy to create new permissions

## Metadata
- id: make-it-easy-to-create-new-permissions-114
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: done
- unattended: true
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session: 

## Description

Add full CRUD functionality for permission rules in the permissions dashboard:
- **Add**: Button to create a new permission rule with tool name, pattern, and category selection
- **Edit**: Inline edit or modal to modify existing rules
- **Delete**: Remove rules from settings files
- Store all rules in the existing `settings.local.json` files (global, area, and project level)
- New/edited rules must be associated with a category for proper grouping in the table

Out of scope:
- Importing from permission-requests.jsonl (future item)
- Editing category definitions themselves

## Success Criteria

- [x] "Add Rule" button opens a form/modal with: tool name input, pattern input (optional), category dropdown
- [x] New rules are saved to the appropriate settings.local.json based on scope (global/area/project)
- [x] Existing rules can be edited inline or via modal (change tool, pattern, or category)
- [x] Rules can be deleted via a delete button/action
- [x] UI shows which rules are "custom" vs predefined category rules
- [x] Category association is persisted and used for grouping display
- [x] Validation prevents duplicate rules at the same scope
- [x] All existing tests pass (no test suite in this project)
- [x] No type errors (npm run typecheck passes)


## Notes

- Rules are stored as strings like `Tool` or `Tool(pattern)` in settings.local.json
- Categories are defined in `PERMISSION_CATEGORIES` in permissions.ts and used for display grouping
- Custom rules that don't match a category are currently shown in "Other"
- Need to track category association for custom rules (could use metadata or naming convention)

## Implementation Plan

### Phase 1: Backend - Add/Delete Rule API

1. **Extend `/api/permissions/rule` endpoint**
   - Files: `app/src/app/api/permissions/rule/route.ts`
   - Add POST method for creating new rules
   - Add DELETE method for removing rules
   - Validation: prevent duplicate rules at same scope
   - Verification: Test via curl/fetch that new endpoints work

2. **Add custom rule category storage**
   - Files: `app/src/lib/permissions.ts`
   - Store custom rule-to-category mappings in settings files under `permissions.customCategories` key
   - Structure: `{ "customCategories": { "MyRule(pattern)": "Git Commands" } }`
   - Add functions: `writeCustomCategory()`, `readCustomCategories()`
   - Verification: Check settings file has correct structure after save

### Phase 2: Frontend - Add Rule Modal

3. **Create AddRuleDialog component**
   - Files: `app/src/components/add-rule-dialog.tsx` (new)
   - Props: `open`, `onOpenChange`, `scope` (global/area:X/projectPath), `existingRules`, `onRuleAdded`
   - Form fields: tool name (required), pattern (optional), category (dropdown)
   - Uses existing Dialog, Input, Select components
   - Validation: tool name required, no duplicate rules
   - Verification: Dialog opens, form validates, submits to API

4. **Add "Add Rule" button to permissions page**
   - Files: `app/src/app/permissions/page.tsx`
   - Place button in header area next to "Permissions" title
   - Button opens AddRuleDialog with scope selector (global by default)
   - After successful add, refresh permissions state
   - Verification: Button visible, opens modal, rule appears in table after add

### Phase 3: Frontend - Edit and Delete Actions

5. **Add inline edit/delete buttons per rule row**
   - Files: `app/src/app/permissions/page.tsx`
   - Add pencil (edit) and trash (delete) icons to each rule row
   - Only show for custom rules (not predefined category rules)
   - Edit: open pre-filled AddRuleDialog in "edit mode"
   - Delete: confirmation, then call DELETE endpoint
   - Verification: Icons appear, edit opens modal with values, delete removes rule

6. **Create EditRuleDialog (reuse AddRuleDialog)**
   - Modify AddRuleDialog to support edit mode
   - Pass existing rule data as props
   - On save: delete old rule + add new rule (simple approach)
   - Verification: Edit modal shows current values, save updates rule

### Phase 4: Visual Indicators and Polish

7. **Add visual indicator for custom rules**
   - Files: `app/src/app/permissions/page.tsx`
   - Show small badge/icon next to custom rules (not in PERMISSION_CATEGORIES)
   - Use `isRuleInCategory()` from permissions.ts for detection
   - Verification: Custom rules visually distinct from predefined ones

### Verification

- `npm run typecheck` passes
- `npm run lint` passes
- Manual test: Add a custom rule, verify it appears in correct category
- Manual test: Edit a rule, verify changes persist
- Manual test: Delete a rule, verify it's removed
- Manual test: Duplicate rule validation prevents duplicates

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3001
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3001/permissions
2. Verify "Add Rule" button is visible in the header
3. Click "Add Rule" button
4. Verify modal appears with: tool name input, pattern input, category dropdown, scope selector
5. Fill in form: tool="MyTest", pattern="test:*", category="Other"
6. Click save, verify modal closes
7. Expand "Other" category in the table
8. Verify new rule "MyTest(test:*)" appears with custom badge
9. Verify edit (pencil) and delete (trash) icons are visible next to the rule
10. Click edit icon, verify modal opens with pre-filled values
11. Change pattern to "test2:*", save
12. Verify rule updated in table
13. Click delete icon, confirm deletion
14. Verify rule removed from table

## Execution Log

- 2026-01-28T15:37:49.501Z Work item created
- 2026-01-28T15:42:00.000Z Goals defined, success criteria added
- 2026-01-28T15:48:00.000Z Implementation plan created
- 2026-01-28T16:05:00.000Z Phase 1 complete: Added POST/DELETE to /api/permissions/rule, added custom category storage
- 2026-01-28T16:15:00.000Z Phase 2 complete: Created AddRuleDialog component, added "Add Rule" button to page
- 2026-01-28T16:20:00.000Z Phase 3 complete: Added edit/delete icons for custom rules, integrated edit mode
- 2026-01-28T16:22:00.000Z Phase 4 complete: Added purple "custom" badge for custom rules
- 2026-01-28T16:25:00.000Z Browser verification: All manual tests passed
- 2026-01-28T16:26:00.000Z All success criteria verified
- 2026-01-28T16:26:00.000Z Ready for /flywheel-done
- 2026-01-28T16:30:00.000Z Committed and pushed to main (d23d681)
- 2026-01-28T16:30:00.000Z Work item completed
