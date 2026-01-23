# Permissions errors

## Metadata
- id: permissions-errors-922
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: executing
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Permission rules in flywheel-gsd use invalid syntax. The `:*` pattern must be at the END of a rule for prefix matching, but several rules use it in the middle (e.g., `Bash(rm:*-worktrees/*)`).

**Invalid rules to fix:**
- `Bash(rm:*-worktrees/*)` → `Bash(rm *-worktrees/*)`
- `Bash(/bin/rm:*-worktrees/*)` → `Bash(/bin/rm *-worktrees/*)`
- `Bash(ls:*-worktrees/*)` → `Bash(ls *-worktrees/*)`
- `Bash(/bin/ls:*-worktrees/*)` → `Bash(/bin/ls *-worktrees/*)`
- `Bash(cd:~/personal/flywheel-gsd*)` → `Bash(cd ~/personal/flywheel-gsd*)`
- `Bash(ls:~/.claude/*)` → `Bash(ls ~/.claude/*)`
- `Bash(ls:.claude/*)` → `Bash(ls .claude/*)`
- `Bash(mv:~/personal/flywheel-gsd/work/*)` → `Bash(mv ~/personal/flywheel-gsd/work/*)`

The pattern is: use SPACE for wildcard matching, use `:*` only at the END for prefix matching.

## Success Criteria

- [x] All permission rules in `app/src/lib/permissions.ts` use valid syntax
- [x] Use space-based wildcard matching (e.g., `Bash(rm *)`) instead of invalid `:*` mid-pattern
- [ ] No "Settings Error" when launching Claude Code
- [x] Build passes with no type errors

## Implementation Plan

### Phase 1: Fix Permission Rule Syntax

1. **Update flywheel permission rules**
   - File: `app/src/lib/permissions.ts`
   - Lines 193-200 in the flywheel permission category
   - Change colon (`:`) to space for wildcard matching:

   | Line | Invalid | Fixed |
   |------|---------|-------|
   | 193 | `Bash(ls:~/.claude/*)` | `Bash(ls ~/.claude/*)` |
   | 194 | `Bash(ls:.claude/*)` | `Bash(ls .claude/*)` |
   | 195 | `Bash(mv:~/personal/flywheel-gsd/work/*)` | `Bash(mv ~/personal/flywheel-gsd/work/*)` |
   | 196 | `Bash(rm:*-worktrees/*)` | `Bash(rm *-worktrees/*)` |
   | 197 | `Bash(/bin/rm:*-worktrees/*)` | `Bash(/bin/rm *-worktrees/*)` |
   | 198 | `Bash(cd:~/personal/flywheel-gsd*)` | `Bash(cd ~/personal/flywheel-gsd*)` |
   | 199 | `Bash(ls:*-worktrees/*)` | `Bash(ls *-worktrees/*)` |
   | 200 | `Bash(/bin/ls:*-worktrees/*)` | `Bash(/bin/ls *-worktrees/*)` |

### Verification

1. Run `npm run build` in `app/` directory - should pass
2. Re-enable Flywheel permissions on a project via the permissions page
3. Launch Claude Code - should not show "Settings Error"

## Execution Log

- 2026-01-23T14:40:24.113Z Work item created
- 2026-01-23T14:45:00.000Z Goals defined, success criteria added
- 2026-01-23T14:47:00.000Z Implementation plan created
- 2026-01-23 15:02 Status: executing
- 2026-01-23 15:02 Fixed 8 invalid permission rules in app/src/lib/permissions.ts (lines 193-200)
- 2026-01-23 15:02 Changed colon to space for wildcard matching in flywheel category
- 2026-01-23 15:02 Build passed with no type errors
