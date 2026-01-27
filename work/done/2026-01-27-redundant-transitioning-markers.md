# Redundant transitioning markers

## Metadata
- id: redundant-transitioning-markers-612
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

When launching from the dashboard UI, the dashboard creates the transitioning marker file. Then the skill instructions also tell the agent to create it, resulting in a redundant operation. The "Mark as Transitioning" step in each flywheel skill should check if the marker already exists and skip creation if so.

## Success Criteria

- [x] Each flywheel skill's "Mark as Transitioning" step checks if the marker file already exists before creating it
- [x] If marker exists, skill skips creation silently
- [x] If marker does not exist (e.g. skill run from CLI without dashboard), skill creates it as before
- [x] All four skills updated: flywheel-define, flywheel-plan, flywheel-execute, flywheel-done

## Implementation Plan

### Phase 1: Update all four skill files

Each skill file is at `~/.claude/commands/flywheel-{name}.md`. All four have an identical "Mark as Transitioning" section. Update each to add an existence check.

1. **Update `flywheel-define.md`**
   - File: `~/.claude/commands/flywheel-define.md`
   - Replace the "Mark as Transitioning" bash block to first check `if [ -f "$FLYWHEEL_PATH/.flywheel-transitioning-$WORK_ITEM_ID" ]` — if exists, skip; if not, create as before
   - Add instruction text: "If the marker already exists (e.g. created by the dashboard), skip this step silently."

2. **Update `flywheel-plan.md`** — same change

3. **Update `flywheel-execute.md`** — same change

4. **Update `flywheel-done.md`** — same change

### Verification

- Read each file and confirm the existence check is present
- No build needed (markdown skill files, not compiled code)

## Execution Log

- 2026-01-27T13:45:36.678Z Work item created
- 2026-01-27T15:20:00.000Z Goals defined, success criteria added
- 2026-01-27T15:25:00.000Z Implementation plan created
- 2026-01-27T15:35:00.000Z Updated all 4 skill files with existence check
- 2026-01-27T15:35:00.000Z All success criteria verified
- 2026-01-27T15:35:00.000Z Ready for /flywheel-done
- 2026-01-27T15:40:00.000Z Committed and pushed to main
- 2026-01-27T15:40:00.000Z Work item completed
