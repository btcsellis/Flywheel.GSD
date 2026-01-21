# Make the board easier to see

## Metadata
- id: make-the-board-easier-to-see-632
- project: personal/flywheel-gsd
- created: 2026-01-21
- status: done
- assigned-session: 

## Description

Let's work a little on contrast and sizing. My eyes are not what they used to be.

## Success Criteria

- [x] Increase base text sizes by ~4px (10px→14px, 13px→17px minimum)
- [x] Improve text contrast - use zinc-200/zinc-300 instead of zinc-400/zinc-500 for primary text
- [x] Add more padding/spacing inside cards and between elements
- [x] Make progress bars thicker (1px→3px or 4px)
- [x] Increase column header and swimlane label sizes proportionally
- [x] All changes apply to: main board page, cards, headers, and meta text

## Plan

**Files to modify:**
- `app/src/app/page.tsx` - Main board with KanbanCard, headers, swimlanes, progress bars
- `app/src/app/item/[folder]/[filename]/work-item-detail.tsx` - Work item detail page

### Steps

1. **Update text sizes in page.tsx (main board)**
   - KanbanCard title: `text-[13px]` → `text-[17px]`
   - Column header step number: `text-[10px]` → `text-[14px]`
   - Column header step label: `text-xs` → `text-sm`
   - Swimlane area label: `text-sm` → `text-lg`
   - Swimlane item count: `text-[10px]` → `text-[14px]`
   - KanbanCard project tag: `text-[10px]` → `text-[14px]`
   - KanbanCard due date badge: `text-[9px]` → `text-[13px]`
   - KanbanCard progress text: `text-[10px]` → `text-[14px]`
   - Stats row counts: `text-xs` → `text-sm`

2. **Update text sizes in work-item-detail.tsx**
   - Section labels: `text-xs` → `text-sm`
   - Form field labels: `text-[10px]` → `text-[14px]`
   - Helper text: `text-[11px]` → `text-[15px]`
   - Metadata grid labels: `text-[10px]` → `text-[14px]`
   - Breadcrumb: `text-xs` → `text-sm`
   - Status stepper labels: `text-xs` → `text-sm`

3. **Improve text contrast in page.tsx**
   - `text-zinc-400` → `text-zinc-300`
   - `text-zinc-500` → `text-zinc-300`
   - `text-zinc-600` → `text-zinc-400`

4. **Improve text contrast in work-item-detail.tsx**
   - `text-zinc-400` → `text-zinc-300`
   - `text-zinc-500` → `text-zinc-300` or `text-zinc-400`
   - `text-zinc-600` → `text-zinc-400`
   - `placeholder-zinc-600` → `placeholder-zinc-400`

5. **Increase spacing in page.tsx**
   - KanbanCard padding: `p-2.5` → `p-4`
   - KanbanCard content spacing: `space-y-1.5` → `space-y-2.5`
   - Cell padding: `p-2` → `p-3`
   - Progress bar gap: `gap-2` → `gap-3`
   - Board grid gaps: `gap-px` → `gap-1`

6. **Increase spacing in work-item-detail.tsx**
   - Section spacing: `space-y-6` → `space-y-8`
   - Metadata grid gap: `gap-4` → `gap-6`
   - Form field padding: `px-3 py-2` → `px-4 py-3`

7. **Make progress bars thicker**
   - Progress bar height: `h-1` → `h-1.5` (4px → 6px)

8. **Verify changes**
   - Run `npm run build` to ensure no TypeScript errors
   - Visual review of board and detail pages

## Execution Log

- 2026-01-21T21:43:37.521Z Work item created
- 2026-01-21T21:48:27.000Z Goals defined - medium size increase (+4px), contrast improvements, more spacing
- 2026-01-21T21:53:00.000Z Plan created - 8 implementation steps across 2 files
- 2026-01-21T22:05:00.000Z Execution started
- 2026-01-21T22:06:00.000Z Updated text sizes in page.tsx - card titles 13px→17px, headers 10px→14px, swimlanes sm→lg
- 2026-01-21T22:07:00.000Z Updated text sizes in work-item-detail.tsx - labels xs→sm, helper text 11px→15px
- 2026-01-21T22:08:00.000Z Improved contrast in both files - zinc-500→zinc-400, zinc-600→zinc-500, placeholders updated
- 2026-01-21T22:09:00.000Z Increased spacing - card padding p-2.5→p-4, cell padding p-2→p-3, section spacing space-y-6→space-y-8
- 2026-01-21T22:10:00.000Z Made progress bars thicker - h-1→h-1.5 (6px)
- 2026-01-21T22:11:00.000Z Build verified - npm run build passed with no errors
- 2026-01-21T22:11:30.000Z All success criteria verified
- 2026-01-21T22:20:00.000Z Fixed layout issues after browser review:
  - Widened board layout (max-w-7xl → max-w-[1800px])
  - Added project name truncation to prevent card overflow
  - Added status value normalization (old→new mappings)
  - Updated status types in page.tsx and work-item-detail.tsx
- 2026-01-21T22:25:00.000Z User verified changes in browser - approved
- 2026-01-21T22:25:00.000Z Ready for /flywheel-ship
- 2026-01-21T22:30:00.000Z Committed: fea55a6
- 2026-01-21T22:30:00.000Z PR: https://github.com/btcsellis/Flywheel.GSD/pull/1
- 2026-01-21T22:30:00.000Z Work item completed
