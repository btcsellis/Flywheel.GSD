# Transitioning marker question

## Metadata
- id: transitioning-marker-question-338
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

When a /flywheel skill tries to add a transitioning marker via `cat > .flywheel-transitioning-*`, Claude Code prompts for approval every time. No existing permission rule in the flywheel category covers this. Add permission rules to the flywheel category in `permissions.ts` that auto-approve creating and removing `.flywheel-transitioning-*` and `.flywheel-prompt-*` files, scoped to the flywheel-gsd path. The exact Bash permission pattern format needs to be tested to find what Claude Code actually matches against for heredoc/redirect commands.

## Success Criteria

- [x] Permission rules added to the flywheel category in `app/src/lib/permissions.ts` covering creation and removal of `.flywheel-transitioning-*` and `.flywheel-prompt-*` files
- [x] Rules are scoped to the flywheel-gsd repo path (not overly broad)
- [x] After enabling the flywheel permission category, the transitioning marker `cat >` command no longer prompts for approval
- [x] Existing flywheel permission rules are unchanged
- [x] No type errors
- [x] App builds successfully (`npm run build` in app/)

## Implementation Plan

### Phase 1: Add permission rules

1. **Add transitioning marker and prompt file rules to flywheel category**
   - File: `app/src/lib/permissions.ts`
   - Add rules to the existing `flywheel` category in `PERMISSION_CATEGORIES`
   - Candidate rules (test during execution to find working patterns):
     - `Bash(cat > ~/personal/flywheel-gsd/.flywheel-transitioning-*:*)` — create transitioning markers
     - `Bash(cat > ~/personal/flywheel-gsd/.flywheel-prompt-*:*)` — create prompt files
     - `Bash(rm -f ~/personal/flywheel-gsd/.flywheel-*:*)` — remove marker/prompt files
     - `Bash(rm ~/personal/flywheel-gsd/.flywheel-*:*)` — remove without -f
   - If redirect patterns don't match, fall back to broader `Bash(cat:*)` scoped via the description field, or use Write tool instead of Bash in skill instructions

### Phase 2: Test the permission patterns

2. **Verify patterns match actual commands**
   - Enable the flywheel category in settings
   - Run a test `cat >` heredoc command to create a transitioning marker
   - Confirm it auto-approves without prompting
   - If it still prompts, iterate on the pattern format
   - If no Bash pattern works for heredoc redirects, pivot to alternative: change the skill instructions to use `Write` tool instead of `Bash(cat >)` for creating marker files

### Phase 3: Build verification

3. **Build check**
   - Run `npm run build` in `app/` — must pass with no type errors

## Execution Log

- 2026-01-27T13:59:35.879Z Work item created
- 2026-01-27T14:45:00.000Z Goals defined, success criteria added
- 2026-01-27T15:00:00.000Z Implementation plan created
- 2026-01-27T15:10:00.000Z Added 3 permission rules to flywheel category and global settings.json
- 2026-01-27T15:10:00.000Z Tested: cat > heredoc and rm -f both auto-approve without prompting
- 2026-01-27T15:10:00.000Z npm run build passes
- 2026-01-27T15:10:00.000Z All success criteria verified
- 2026-01-27T15:10:00.000Z Ready for /flywheel-done
