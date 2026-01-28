# Clean up and improve flywheel code

## Metadata
- id: clean-up-and-improve-flywheel-code-748
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: done
- unattended: true
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

When flywheel-execute does its testing, it typically encounters a few errors or warnings and then dismisses them because they're not related to the current work item. Let's find those and fix them.

**Scope:**
- Fix 5 ESLint warnings (all `@typescript-eslint/no-unused-vars`)
- Achieve zero warnings from `npm run build`
- Delete unused `isClaudeRunningInSession` function as dead code

**Out of scope:**
- Adding test infrastructure (separate work item)
- Adding stricter lint rules

## Success Criteria

- [x] `npm run lint` produces 0 errors and 0 warnings
- [x] `npm run build` produces 0 errors and 0 warnings
- [x] Remove unused `WorkflowType` import from `dashboard-client.tsx`
- [x] Remove unused `WorkItem` and `WorkItemStatus` imports from `item/[folder]/[filename]/page.tsx`
- [x] Remove unused `accent` variable from `new/page.tsx` (also removed unused `currentArea`)
- [x] Remove unused `isClaudeRunningInSession` function from `terminal.ts`
- [x] No type errors

## Implementation Plan

### Phase 1: Fix Unused Imports/Variables

1. **Remove unused `WorkflowType` import from `dashboard-client.tsx`**
   - File: `app/src/app/dashboard-client.tsx`
   - Line 7: Change `import type { WorkItem, WorkItemStatus, WorkflowType }` to `import type { WorkItem, WorkItemStatus }`
   - Verification: `npm run lint` no longer reports warning for this file

2. **Remove unused type imports from `item/[folder]/[filename]/page.tsx`**
   - File: `app/src/app/item/[folder]/[filename]/page.tsx`
   - Line 1: Change `import { getWorkItem, type WorkItem, type WorkItemStatus }` to `import { getWorkItem }`
   - Verification: `npm run lint` no longer reports warnings for this file

3. **Remove unused `accent` variable from `new/page.tsx`**
   - File: `app/src/app/new/page.tsx`
   - Line 143: Delete `const accent = currentArea?.color || '#6b7280';`
   - Verification: `npm run lint` no longer reports warning for this file

### Phase 2: Remove Dead Code

4. **Remove unused `isClaudeRunningInSession` function from `terminal.ts`**
   - File: `app/src/lib/terminal.ts`
   - Lines 364-374: Delete the entire `isClaudeRunningInSession` function
   - Verification: `npm run lint` no longer reports warning for this file

### Phase 3: Verification

5. **Run lint check**
   - Command: `cd app && npm run lint`
   - Expected: 0 errors, 0 warnings

6. **Run build**
   - Command: `cd app && npm run build`
   - Expected: Build succeeds with 0 errors, 0 warnings

## Execution Log

- 2026-01-28T16:03:44.702Z Work item created
- 2026-01-28T16:10:00Z Goals defined, success criteria added
- 2026-01-28T16:12:00Z Implementation plan created
- 2026-01-28T16:15:00Z Removed unused WorkflowType import from dashboard-client.tsx
- 2026-01-28T16:15:00Z Removed unused WorkItem, WorkItemStatus imports from page.tsx
- 2026-01-28T16:15:00Z Removed unused accent and currentArea from new/page.tsx
- 2026-01-28T16:15:00Z Removed unused isClaudeRunningInSession function from terminal.ts
- 2026-01-28T16:15:00Z Verified: npm run lint - 0 errors, 0 warnings
- 2026-01-28T16:15:00Z Verified: npm run build - success, no warnings
- 2026-01-28T16:15:00Z All success criteria verified, ready for /flywheel-done
- 2026-01-28T16:18:00Z Committed: 5608043 - fix: remove unused imports, variables, and dead code
- 2026-01-28T16:18:00Z Pushed to main
- 2026-01-28T16:18:00Z Work item completed
