# Auto-capture learnings in /flywheel-done

## Metadata
- id: auto-capture-learnings-in-flywheel-done-776
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Enhance `/flywheel-done` to automatically detect and capture solutions worth remembering. After completing normal done steps, Claude analyzes the session for learning signals and proposes adding to the knowledge base.

**Detection signals:**
- Multiple failed attempts before success
- Error messages that were resolved
- Non-obvious workarounds discovered
- Patterns that have occurred before

**Capture flow:**
1. Normal `/flywheel-done` completes (commit, PR, archive)
2. Claude scans execution log + conversation for learning signals
3. If learning detected → propose draft solution doc
4. User can: approve as-is, edit before saving, or skip
5. If approved → save to `flywheel-gsd/solutions/[category]/`

**Storage:**
- Location: `flywheel-gsd/solutions/` (centralized)
- Categories: `tool-environment/`, `flywheel-patterns/`, `project-specific/`
- New categories can be proposed if none fit

**Integration with /flywheel-execute:**
- Before starting work, search `solutions/` for relevant prior learnings
- Surface any matches to avoid repeating past mistakes

## Success Criteria

- [x] `solutions/` directory created in flywheel-gsd with initial categories (tool-environment/, flywheel-patterns/, project-specific/)
- [x] `/flywheel-done` skill updated to analyze session for learnings after normal completion
- [x] Detection heuristics identify: retry patterns, error resolutions, workarounds, repeated issues
- [x] When learning detected, Claude shows draft solution doc with options: approve / edit / skip
- [x] Approved solutions saved to appropriate category folder with simple YAML frontmatter
- [x] `/flywheel-execute` searches `solutions/` before starting and surfaces relevant prior learnings
- [x] At least one real solution captured to validate the workflow

## Notes

**Simple schema for solutions:**
```yaml
---
date: YYYY-MM-DD
category: tool-environment | flywheel-patterns | project-specific | [new]
tags: [keyword1, keyword2]
---

# Title

## Problem
[What went wrong]

## Solution
[What fixed it]

## Prevention
[How to avoid next time]
```

**Based on:** Evaluation of compound-engineering-plugin (see `work/done/2026-01-23-evaluate-compound-engineering-plugin.md`)

## Implementation Plan

### Phase 1: Create Solutions Directory Structure

1. **Create `solutions/` directory in flywheel-gsd**
   - Create `flywheel-gsd/solutions/`
   - Create subdirectories: `tool-environment/`, `flywheel-patterns/`, `project-specific/`
   - Add `.gitkeep` files to preserve empty directories
   - Verification: `ls -la flywheel-gsd/solutions/`

2. **Create solution template file**
   - Create `flywheel-gsd/solutions/TEMPLATE.md` as reference
   - Include YAML frontmatter structure and section headings
   - Verification: File exists with correct structure

### Phase 2: Update /flywheel-done Skill

3. **Add learning detection section to flywheel-done.md**
   - File: `~/.claude/commands/flywheel-done.md`
   - Add new section after "### 8. Clean Up" called "### 9. Capture Learnings"
   - Include detection heuristics:
     - Scan execution log for "retry", "failed", "error", "workaround"
     - Look for multiple attempts at same operation
     - Check for non-obvious solutions (workarounds, fallbacks)
   - Verification: Read file and confirm section exists

4. **Add learning proposal flow**
   - When learning detected, draft a solution document
   - Present to user with options: approve / edit / skip
   - Use format from TEMPLATE.md
   - Verification: Logic documented in skill file

5. **Add solution saving logic**
   - If approved, save to `$FLYWHEEL_PATH/solutions/[category]/`
   - Generate filename from title (kebab-case)
   - Add to git and commit with flywheel changes
   - Verification: Logic documented in skill file

6. **Renumber existing sections**
   - Current "### 9. Report" becomes "### 10. Report"
   - Verification: Section numbers are sequential

### Phase 3: Update /flywheel-execute Skill

7. **Add solutions search to flywheel-execute.md**
   - File: `~/.claude/commands/flywheel-execute.md`
   - Add new section after "### 2. Transition to Executing" called "### 2b. Search Prior Learnings"
   - Search `$FLYWHEEL_PATH/solutions/` for relevant keywords from work item
   - Use grep on tags, titles, problem descriptions
   - Verification: Read file and confirm section exists

8. **Add surfacing logic**
   - If matches found, display relevant solutions before starting
   - Format: title, problem summary, link to full doc
   - Verification: Logic documented in skill file

### Phase 4: Validate with Real Capture

9. **Test the workflow**
   - This work item itself should trigger learning capture in `/flywheel-done`
   - If not, manually create a test solution to validate storage works
   - Verification: At least one `.md` file exists in `solutions/` subdirectory

### Verification

- `ls flywheel-gsd/solutions/` shows three subdirectories
- `~/.claude/commands/flywheel-done.md` contains "Capture Learnings" section
- `~/.claude/commands/flywheel-execute.md` contains "Search Prior Learnings" section
- At least one solution file exists in `solutions/`

## Execution Log

- 2026-01-23T21:07:08.700Z Work item created
- 2026-01-23T21:20:00.000Z Goals defined, success criteria added
- 2026-01-23T21:30:00.000Z Implementation plan created
- 2026-01-23T21:35:00.000Z Transitioned to executing, moved to active/
- 2026-01-23T21:36:00.000Z Phase 1 complete: Created solutions/ directory with categories
- 2026-01-23T21:38:00.000Z Phase 2 complete: Updated flywheel-done.md with "Capture Learnings" section
- 2026-01-23T21:40:00.000Z Phase 3 complete: Updated flywheel-execute.md with "Search Prior Learnings" section
- 2026-01-23T21:42:00.000Z Phase 4 complete: Created sample solution (worktree-cleanup-cwd-issue.md)
- 2026-01-23T21:43:00.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-23T21:45:00.000Z Work item completed (shipped to main)
