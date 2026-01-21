# Fix statuses in Claude Code prompts

## Metadata
- id: fix-statuses-in-claude-code-prompts-572
- project: personal/flywheel-gsd
- created: 2026-01-21
- status: done
- assigned-session: 

## Description

When asking Claude Code to help with work items, it's setting old statuses instead of the new ones. Also, new work items start in defined rather than New.

The correct statuses are: `new | defined | planned | executing | review | done | blocked`

The old/incorrect statuses being used: `created | goals-set | planned | executing | verifying | done | blocked`

## Success Criteria

- [x] Update `WorkItemStatus` type in `app/src/lib/work-items.ts` to use new status names
- [x] Update `createWorkItem` function to set initial status to `new` instead of `goals-set`
- [x] Update `getStatusColor` function with correct status names
- [x] Update `STATUS_ACTIONS` in `app/src/lib/prompts.ts` with new status names
- [x] Update all prompt text in `generatePromptForStatus` to reference new status names
- [x] Update status list in `README.md`
- [x] Update status list in `CLAUDE.md`
- [x] Verify TypeScript compiles without errors

## Plan

1. Update `WorkItemStatus` type in `app/src/lib/work-items.ts` (lines 4-11):
   - Change `'created'` to `'new'`
   - Change `'goals-set'` to `'defined'`
   - Change `'verifying'` to `'review'`
   - Update comments to match new names

2. Update `parseMetadata` function in `app/src/lib/work-items.ts` (line 148):
   - Change default status from `'created'` to `'new'`

3. Update `createWorkItem` function in `app/src/lib/work-items.ts` (line 261):
   - Change initial status from `'goals-set'` to `'new'`

4. Update `getStatusColor` function in `app/src/lib/work-items.ts` (lines 288-296):
   - Change case `'created'` to `'new'`
   - Change case `'goals-set'` to `'defined'`
   - Change case `'verifying'` to `'review'`

5. Update `STATUS_ACTIONS` in `app/src/lib/prompts.ts` (lines 9-17):
   - Change key `'created'` to `'new'`, targetStatus to `'defined'`
   - Change key `'goals-set'` to `'defined'`, targetStatus to `'planned'`
   - Change key `'verifying'` to `'review'`, targetStatus to `'done'`

6. Update `generatePromptForStatus` in `app/src/lib/prompts.ts` (lines 31-97):
   - Change case `'created'` to `'new'`, update status references in prompt text
   - Change case `'goals-set'` to `'defined'`, update status references in prompt text
   - Change case `'verifying'` to `'review'`, update status references in prompt text
   - Update all other cases that reference old status names in prompt text

7. Update `CLAUDE.md`:
   - Line 39: Change status list from `created | goals-set | planned | executing | verifying | done | blocked` to `new | defined | planned | executing | review | done | blocked`
   - Lines 64-69: Update workflow step names (Created→New, Goals Set→Defined, Verifying→Review)

8. Update `README.md` (line 114):
   - Change status list to `new | defined | planned | executing | review | done | blocked`

9. Run TypeScript compilation to verify no errors:
   - `cd app && npm run build`

## Execution Log

- 2026-01-21T21:50:29.326Z Work item created
- 2026-01-21 Goals defined, status changed to goals-set
- 2026-01-21 Plan created, status changed to planned
- 2026-01-21 Execution started
- 2026-01-21 Updated WorkItemStatus type (created→new, goals-set→defined, verifying→review)
- 2026-01-21 Updated parseMetadata default status to 'new'
- 2026-01-21 Updated createWorkItem initial status to 'new'
- 2026-01-21 Updated getStatusColor with new status names
- 2026-01-21 Updated STATUS_ACTIONS in prompts.ts
- 2026-01-21 Updated generatePromptForStatus prompt text
- 2026-01-21 Updated CLAUDE.md status list and workflow steps
- 2026-01-21 Updated README.md status list
- 2026-01-21 Fixed work-item-detail.tsx WORKFLOW_STEPS and blocked/unblock logic
- 2026-01-21 TypeScript build passed successfully
- 2026-01-21 All success criteria verified, status changed to review
- 2026-01-21 Ready for /flywheel-ship
- 2026-01-21 PR created: https://github.com/btcsellis/Flywheel.GSD/pull/1
- 2026-01-21 Work item completed
