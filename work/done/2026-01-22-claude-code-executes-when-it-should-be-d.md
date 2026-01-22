# Claude Code executes when it should be defining or planning

## Metadata
- id: claude-code-executes-when-it-should-be-d-370
- project: personal/flywheel-gsd
- created: 2026-01-22
- status: done
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-claude-code-executes-when-it-should-be-d-370
- assigned-session:

## Description

Claude Code sometimes jumps ahead to writing code during `/flywheel-define` or `/flywheel-plan` phases when it should only be working with markdown files (work item files and PLAN.md).

The skills need stronger guardrails to enforce the separation of concerns:
- **define**: Only ask questions and update the work item markdown
- **plan**: Only create/update PLAN.md and update work item status
- **execute**: This is the ONLY phase that should write code

## Success Criteria

- [x] `/flywheel-define` skill has explicit "DO NOT" statements prohibiting code file edits
- [x] `/flywheel-plan` skill has explicit "DO NOT" statements prohibiting code file edits
- [x] Both skills specify that only `.md` files in the work item path or PLAN.md should be modified
- [x] Both skills include a clear "What this command does NOT do" section
- [x] Language is direct and unambiguous (e.g., "NEVER", "ONLY", "DO NOT")

## Notes

- This is a prompt engineering fix, not a code change
- The goal is to make the boundaries crystal clear so Claude doesn't get confused about what phase it's in
- Skill files are in `~/.claude/commands/` directory

## Implementation Plan

### Phase 1: Update flywheel-define.md

1. **Add prominent "DEFINITION MODE ONLY" header section**
   - Add section after title, matching the style in flywheel-plan.md
   - Include explicit "DO NOT" statements
   - Files: `~/.claude/commands/flywheel-define.md`

2. **Add "What this command does NOT do" section**
   - Add after "Status Transition" section
   - Explicitly list prohibited actions with strong language
   - Files: `~/.claude/commands/flywheel-define.md`

3. **Specify allowed file modifications**
   - Add explicit statement that ONLY the work item `.md` file should be modified
   - Files: `~/.claude/commands/flywheel-define.md`

### Phase 2: Update flywheel-plan.md

4. **Strengthen the existing "PLANNING MODE ONLY" section**
   - Add more specific prohibitions
   - Use stronger language (NEVER, ONLY)
   - Files: `~/.claude/commands/flywheel-plan.md`

5. **Add "What this command does NOT do" section**
   - Add after "Status Transition" section for consistency
   - Explicitly list prohibited actions
   - Files: `~/.claude/commands/flywheel-plan.md`

6. **Specify allowed file modifications**
   - Explicitly state only work item `.md` file should be modified
   - Files: `~/.claude/commands/flywheel-plan.md`

### Verification

- Review both files for clear, unambiguous guardrails
- Ensure "DO NOT" sections are prominent and early in each file
- Confirm allowed file modifications are explicit

## Execution Log

- 2026-01-22T16:28:31.858Z Work item created
- 2026-01-22 Defined: Added success criteria for enforcing phase boundaries in flywheel skills
- 2026-01-22 Planned: Implementation plan created for updating flywheel-define.md and flywheel-plan.md
- 2026-01-22 Executing: Updated flywheel-define.md with guardrails and "What This Command Does NOT Do" section
- 2026-01-22 Executing: Updated flywheel-plan.md with stronger guardrails and "What This Command Does NOT Do" section
- 2026-01-22 All success criteria verified
- 2026-01-22 Ready for /flywheel-done
- 2026-01-22 Note: Changes are in ~/.claude/commands/ (user-level, not repo-tracked)
- 2026-01-22 Work item completed (no PR needed - config changes only)
