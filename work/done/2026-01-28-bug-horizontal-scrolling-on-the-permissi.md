# Bug - horizontal scrolling on the permissions dashboard is weird

## Metadata
- id: bug-horizontal-scrolling-on-the-permissi-548
- project: personal/flywheel-gsd
- created: 2026-01-28
- status: done
- unattended: true
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

The column data is still visible behind the pinned first column when you scroll to the right on the permissions dashboard table. The sticky "Rule" column has `bg-inherit` which inherits semi-transparent backgrounds (like `bg-zinc-900/20` on alternating rows and `hover:bg-zinc-800/30`), allowing scrolled content to show through.

## Success Criteria

- [x] The sticky first column (Rule column) has an opaque background that fully covers any content scrolling behind it
- [x] The fix maintains the alternating row styling visual appearance
- [x] The fix maintains the hover state visual appearance
- [x] Horizontal scrolling shows no content bleeding through the pinned column
- [x] No type errors (`npm run typecheck` passes)
- [x] App builds successfully (`npm run build` passes)

## Implementation Plan

### Phase 1: Fix Sticky Column Background

1. **Update rule cell background to use opaque colors**
   - File: `app/src/app/permissions/page.tsx`
   - Line ~765: Change `bg-inherit` to explicit opaque backgrounds
   - Use CSS approach: base opaque background + conditional styling with `cn()`
   - Replace the row's `bg-inherit` on the sticky cell with explicit opaque `bg-zinc-900` (matching the table body background)
   - Add opaque versions of alternating row color: `bg-zinc-900` for default, conditionally add `bg-[#18181b]` (zinc-900/20 equivalent as opaque) for even rows
   - Add opaque hover state using `group-hover:bg-zinc-800`

2. **Ensure the fix works with existing row structure**
   - The row has classes: `hover:bg-zinc-800/30 group` and conditional `bg-zinc-900/20` for even rows
   - The sticky cell must override these with opaque equivalents
   - Use the `cn()` utility which is already imported

### Verification

- Run `npm run typecheck` in `/app` directory
- Run `npm run build` in `/app` directory
- Visual test: horizontal scroll the table and verify no content shows through the pinned column

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to http://localhost:3000/permissions
2. Verify the permissions table is visible
3. Expand a category (click on any category row like "File Operations")
4. Scroll horizontally to the right using the scroll area
5. Verify that scrolled column content does NOT appear behind the sticky "Rule" column
6. Verify alternating row styling is still visible (subtle background difference on even rows)
7. Hover over a row and verify the hover state is visible

## Execution Log

- 2026-01-28T16:27:12.599Z Work item created
- 2026-01-28T16:28:00.000Z Goals defined, success criteria added
- 2026-01-28T16:29:00.000Z Implementation plan created
- 2026-01-28T16:50:00.000Z Fixed sticky column background: replaced `bg-inherit` with opaque `bg-zinc-900` + conditional `bg-[#131316]` for even rows + `group-hover:bg-zinc-800`
- 2026-01-28T16:50:30.000Z TypeScript check passed (npx tsc --noEmit)
- 2026-01-28T16:51:00.000Z Build passed (npm run build)
- 2026-01-28T16:52:00.000Z Browser verification: confirmed no content bleeding through sticky column on horizontal scroll
- 2026-01-28T16:52:30.000Z All success criteria verified
- 2026-01-28T16:52:30.000Z Ready for /flywheel-done
- 2026-01-28T16:55:00.000Z Committed: e31c2d9 fix: use opaque backgrounds for sticky column in permissions table
- 2026-01-28T16:55:30.000Z Pushed to main
- 2026-01-28T16:55:30.000Z Work item completed
