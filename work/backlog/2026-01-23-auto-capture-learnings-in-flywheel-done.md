# Auto-capture learnings in /flywheel-done

## Metadata
- id: auto-capture-learnings-in-flywheel-done-776
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: new
- assigned-session:

## Description

  Enhance /flywheel-done to automatically detect and capture solutions worth remembering. After completing normal done steps, Claude analyzes the session
  for learning signals and proposes adding to the knowledge base.

  Detection signals:
  - Multiple failed attempts before success
  - Error messages that were resolved
  - Non-obvious workarounds discovered
  - Patterns that have occurred before

  Flow:
  1. Normal /flywheel-done completes (commit, PR, archive)
  2. Claude scans execution log + conversation
  3. If learning detected → propose capture with draft
  4. User approves/skips
  5. If approved → save to solutions/

  Possible Success Criteria

  - solutions/ directory created with subdirectories (tool-environment/, flywheel-patterns/)
  - /flywheel-done skill updated to analyze session for learnings after completion
  - Detection heuristics identify retry patterns, error resolutions, workarounds
  - When detected, Claude proposes a draft solution doc for approval
  - Approved solutions saved to appropriate category folder
  - At least one real solution auto-captured to validate the workflow

## Success Criteria



## Execution Log

- 2026-01-23T21:07:08.700Z Work item created
