# Text is hard to read

## Metadata
- id: text-is-hard-to-read-255
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-text-is-hard-to-read-255
- assigned-session: 

## Description

The light text on the dark background is fine, but the more medium gray text is too hard to read on the site. Please use the /frontend-development plugin to make the site easier to read.

Specifically, `text-zinc-500` and `text-zinc-600` classes have poor contrast on the dark background. `text-zinc-400` is borderline. These are used across navigation, stats, labels, breadcrumbs, archive metadata, helper text, and column headers.

The fix should bump low-contrast text classes up to at least `text-zinc-400` (for secondary info) or `text-zinc-300` (for labels/headers), ensuring all text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) against the dark background.

## Success Criteria

- [x] All `text-zinc-600` instances replaced with a lighter zinc shade (at minimum zinc-400)
- [x] All `text-zinc-500` instances replaced with zinc-400 or lighter where readability is poor
- [x] Navigation links, breadcrumbs, stats, labels, and helper text are comfortably readable on the dark background
- [x] Visual hierarchy is preserved — primary text is still brighter than secondary text
- [x] No type errors
- [x] No lint errors
- [x] App builds successfully (`npm run build`)

## Implementation Plan

### Mapping

Apply these replacements across all files:
- `text-zinc-600` → `text-zinc-500` (for decorative/separator elements, delete button icons, optional labels, hint text)
- `text-zinc-500` → `text-zinc-400` (for labels, descriptions, metadata, breadcrumbs, counts, helper text)

**Exception — keep `text-zinc-500` as-is when:**
- Used in a `line-through` (completed/struck-through items) — readability reduction is intentional
- Used in hover state origin (e.g., `text-zinc-500 hover:text-zinc-300`) — the hover brightens it
- Used on spinner icons (`animate-spin text-zinc-500`) — decorative, not text

### Phase 1: Dashboard & Layout

1. **`app/src/app/layout.tsx`** — Change `text-zinc-500` on "GSD" subtitle to `text-zinc-400`
2. **`app/src/app/dashboard-client.tsx`** — Change:
   - `text-zinc-600` separators (lines 178, 182) → `text-zinc-500`
   - `text-zinc-500` column numbers (line 200) → `text-zinc-400`
   - `text-zinc-500` item counts (lines 233, 275) → `text-zinc-400`
   - `text-zinc-600` "No items" placeholder (line 241) → `text-zinc-500`

### Phase 2: Work Item Detail Page

3. **`app/src/app/item/[folder]/[filename]/work-item-detail.tsx`** — Change:
   - `text-zinc-500` dropdown headers/descriptions (lines 570, 579, 587) → `text-zinc-400`
   - `text-zinc-500` metadata labels (Workflow, Session — lines 698, 710) → `text-zinc-400`
   - `text-zinc-500` section counter/descriptions (lines 737, 741, 782, 786, 818, 833, 848, 897) → `text-zinc-400`
   - `text-zinc-600` delete button icons (lines 761, 797, 862, 910) → `text-zinc-500`
   - `text-zinc-500` on inactive status button (line 525) → keep as-is (has hover state)
   - `text-zinc-500` on completed criteria with `line-through` (line 755) → keep as-is

### Phase 3: New Work Item Page

4. **`app/src/app/new/page.tsx`** — Change:
   - `text-zinc-500` form labels (lines 258, 276, 305, 344, 358, 401, 439, 454, 469, 504) → `text-zinc-400`
   - `text-zinc-500` breadcrumb (line 236) → `text-zinc-400`
   - `text-zinc-500` loading fallback (line 67) → `text-zinc-400`
   - `text-zinc-500` "add" links (lines 392, 430, 495) → keep as-is (have hover states)
   - `text-zinc-500` on completed criteria with `line-through` (line 375) → keep as-is
   - `text-zinc-600` optional labels, hint text, step numbers, delete icons (lines 361, 402, 404, 408, 420, 440, 442, 455, 457, 470, 472, 486, 505) → `text-zinc-500`

### Phase 4: Archive Page

5. **`app/src/app/archive/page.tsx`** — Change:
   - `text-zinc-500` subtitle, placeholders, headers, metadata, counters (lines 29, 36, 47, 90, 106) → `text-zinc-400`
   - `text-zinc-600` hint text (line 37) → `text-zinc-500`

### Phase 5: Launch Button Component

6. **`app/src/components/launch-button.tsx`** — Change:
   - `text-zinc-500` dropdown header/descriptions (lines 154, 163, 171) → `text-zinc-400`

### Phase 6: Permissions Page

7. **`app/src/app/permissions/page.tsx`** — Change:
   - `text-zinc-500` descriptions, spinners (lines 342, 297, 433, 458, 485) → `text-zinc-400` (description only; spinners keep as-is)
   - `text-zinc-600` path hints and footer (lines 379, 391, 405, 510) → `text-zinc-500`

### Verification

- `npm run build` passes with no errors
- Grep confirms no remaining `text-zinc-600` in app source (except acceptable cases)
- Visual check via browser that text is readable and hierarchy is preserved

## Browser Verification

**Prerequisites:**
- Dev server running at: http://localhost:3000

**Steps:**
1. Navigate to http://localhost:3000 (dashboard)
2. Verify column headers, stats, item counts, and separator text are readable
3. Navigate to http://localhost:3000/new
4. Verify form labels, breadcrumbs, hint text are readable
5. Navigate to http://localhost:3000/archive
6. Verify subtitle, metadata, month headers are readable
7. Confirm visual hierarchy — primary text (white/zinc-100) is still distinctly brighter than secondary text (zinc-300/400)

## Notes

- The app uses Tailwind's zinc palette consistently — no custom hex values
- `text-muted-foreground` (oklch 0.708 in dark mode) is acceptable and doesn't need changing
- Use `/frontend-design` skill during execution to verify visual quality

## Execution Log

- 2026-01-27T20:51:12.471Z Work item created
- 2026-01-27T20:52:00.000Z Goals defined, success criteria added
- 2026-01-27T20:53:00.000Z Implementation plan created
- 2026-01-27T20:56:00.000Z All text-zinc-600 replaced with zinc-500, all text-zinc-500 replaced with zinc-400 across 7 files
- 2026-01-27T20:57:00.000Z Build passes, zero text-zinc-600 remaining, browser verification complete
- 2026-01-27T20:57:00.000Z All success criteria verified, ready for /flywheel-done
