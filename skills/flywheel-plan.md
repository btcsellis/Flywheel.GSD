# Flywheel: Create Implementation Plan

Explore the codebase, design an implementation approach, and transition a work item from `defined` → `planned`.

## PLANNING MODE ONLY - NO IMPLEMENTATION

**CRITICAL**: This command creates an implementation PLAN, not actual code.

**DO NOT:**
- Write or modify any code files (`.ts`, `.tsx`, `.js`, `.json`, `.css`, etc.)
- Create components, functions, or tests
- Execute any implementation steps
- Use the Edit or Write tools on non-markdown files
- Create new files in `src/`, `app/`, `lib/`, or any code directory

**ONLY modify:**
- The work item `.md` file in `work/backlog/` or `work/active/`

The plan will be executed later by `/flywheel-execute`.

---

## Environment

```bash
FLYWHEEL_PATH="${FLYWHEEL_GSD_PATH:-$HOME/personal/flywheel-gsd}"
```

## Process

### 1. Load the Work Item

Check for a prompt file first (launched from dashboard):
```bash
if [ -f .flywheel-prompt-*.txt ]; then
  cat .flywheel-prompt-*.txt
fi
```

Or find a `defined` work item:
```bash
for file in "$FLYWHEEL_PATH/work/backlog/"*.md "$FLYWHEEL_PATH/work/active/"*.md; do
  if grep -q "^- status: defined" "$file" 2>/dev/null; then
    echo "Found: $file"
    cat "$file"
  fi
done
```

Read the work item to understand the success criteria.

### 2. Explore the Codebase

Before planning, understand the current architecture:

- **Find relevant files**: Search for related code, components, modules
- **Understand patterns**: How are similar features implemented?
- **Identify dependencies**: What existing code will this interact with?
- **Note conventions**: Naming, file structure, testing patterns

```bash
# Example exploration commands
ls -la src/
grep -r "relatedFunction" --include="*.ts"
cat src/relevant-file.ts
```

### 3. Design Implementation Approach

Based on exploration, design how to achieve each success criterion:

- What files need to be created or modified?
- What's the order of operations?
- Are there any technical decisions to make?
- What verification will prove each step works?

### 3a. Detect Frontend Changes

Determine if this work item involves frontend/UI changes. Look for indicators in the work item description and success criteria:

**Frontend indicators:**
- Mentions of: UI, dashboard, components, pages, styling, CSS, layout, visual, user-facing, buttons, forms, modals, cards, tables, navigation, responsive
- File patterns: `*.tsx`, `*.jsx`, `*.css`, `*.scss`, `app/`, `components/`, `pages/`
- Frameworks: React, Next.js, Tailwind, styled-components

**If frontend changes are detected:**
- The implementation plan MUST include a `## Browser Verification` section
- This section will be executed by `/flywheel-execute` using the Chrome plugin
- Without this section, frontend changes cannot be visually verified

### 4. Create the Implementation Plan

Update the work item with a detailed plan:

```markdown
## Implementation Plan

### Phase 1: [Description]

1. **[Step title]**
   - [Specific action]
   - [Files affected]
   - [Verification]

2. **[Step title]**
   - [Specific action]
   - [Files affected]
   - [Verification]

### Phase 2: [Description]

3. **[Step title]**
   ...

### Verification

- [How to verify the implementation is complete]
- [Commands to run: tests, typecheck, lint]
```

**If frontend changes detected, also include:**

```markdown
## Browser Verification

**Prerequisites:**
- Dev server running at: [URL, e.g., http://localhost:3000]
- Chrome plugin (Claude in Chrome) must be available

**Steps:**
1. Navigate to [URL/path]
2. Verify [element/component] is visible
3. [Click/interact with element]
4. Verify [expected outcome]

**Example steps:**
- Navigate to http://localhost:3000/dashboard
- Verify "Work Items" heading is visible
- Verify work item cards are displayed
- Click "New" button
- Verify modal appears with form fields
```

The browser verification section is REQUIRED for any work item involving frontend changes. During `/flywheel-execute`, these steps will be executed using the Chrome plugin (`mcp__claude-in-chrome__*` tools).

### 5. Update Work Item Status

Change status from `defined` to `planned`:

```bash
sed -i '' 's/- status: defined/- status: planned/' "$WORK_ITEM_PATH"
```

Add execution log entry:
```markdown
## Execution Log
- [timestamp] Work item created
- [timestamp] Goals defined, success criteria added
- [timestamp] Implementation plan created
```

### 6. Report

```markdown
## Plan Created

**Work Item**: [filename]
**Status**: planned

### Implementation Plan Summary
- Phase 1: [description]
- Phase 2: [description]
- ...

### Files to Modify
- [list of files]

### Next Steps
Run `/flywheel-execute` to implement the plan.
```

### 7. Check for Unattended Mode

After reporting the plan, check if the work item should proceed automatically.

**Check condition:**
1. Work item has `- unattended: true` in metadata

```bash
# Check for unattended flag
grep -q "^- unattended: true" "$WORK_ITEM_PATH"
UNATTENDED=$?
```

**If unattended mode is set ($UNATTENDED == 0):**
- Do NOT show "Run `/flywheel-execute`" in Next Steps
- Instead, immediately invoke `/flywheel-execute` using the Skill tool:

```
Use the Skill tool to invoke "flywheel-execute"
```

**If not in unattended mode:**
- Show the standard "Run `/flywheel-execute`" message and stop

## Status Transition

```
defined → planned
```

This command ONLY performs this single status transition.

## What This Command Does NOT Do

**NEVER:**
- Write or modify code files (`.ts`, `.tsx`, `.js`, `.json`, `.css`, etc.)
- Define success criteria (that's `/flywheel-define`)
- Execute the plan (that's `/flywheel-execute`)
- Use the Edit or Write tools on non-markdown files
- Create new files in `src/`, `app/`, `lib/`, or any code directory

**ONLY:**
- Read files to understand codebase structure and patterns
- Update the work item markdown file with the implementation plan
- Change the work item status from `defined` to `planned`

## Plan Requirements

A good plan includes:

1. **Specific steps**: Exactly what to do, not vague directions
2. **File references**: Which files to create/modify
3. **Order of operations**: Dependencies between steps
4. **Verification**: How to confirm each step is complete
5. **Phases**: Group related steps together

## If Work Item Not Defined

If status is `new`:
- Suggest running `/flywheel-define` first
- Don't try to create a plan without clear success criteria

If status is already `planned` (or later):
- Show existing plan
- Ask if they want to revise it
- If yes, update plan and keep status as `planned`
- If no, suggest running `/flywheel-execute`
