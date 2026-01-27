# Flywheel: Define Work Item

Ask clarifying questions, define success criteria, and transition a work item from `new` → `defined`.

## DEFINITION MODE ONLY - NO CODE

**CRITICAL**: This command defines goals and success criteria. It does NOT implement anything.

**DO NOT:**
- Write or modify any code files (`.ts`, `.tsx`, `.js`, `.json`, `.css`, etc.)
- Create components, functions, or tests
- Execute any implementation steps
- Create PLAN.md or implementation plans

**ONLY modify:**
- The work item `.md` file in `work/backlog/` or `work/active/`

The implementation will happen later via `/flywheel-plan` and `/flywheel-execute`.

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

Or find a `new` work item:
```bash
for file in "$FLYWHEEL_PATH/work/backlog/"*.md "$FLYWHEEL_PATH/work/active/"*.md; do
  if grep -q "^- status: new" "$file" 2>/dev/null; then
    echo "Found: $file"
    cat "$file"
  fi
done
```

Read the work item to understand the initial description.

### 1a. Mark as Transitioning (Dashboard Animation)

Create a transitioning marker file so the dashboard shows the gradient animation. **If the marker already exists** (e.g. created by the dashboard when launching), **skip this step silently**.

```bash
# Extract work item ID and current status
WORK_ITEM_ID=$(grep "^- id:" "$WORK_ITEM_PATH" | cut -d: -f2 | xargs)
CURRENT_STATUS=$(grep "^- status:" "$WORK_ITEM_PATH" | cut -d: -f2 | xargs)

# Only create if it doesn't already exist
if [ ! -f "$FLYWHEEL_PATH/.flywheel-transitioning-$WORK_ITEM_ID" ]; then
  cat > "$FLYWHEEL_PATH/.flywheel-transitioning-$WORK_ITEM_ID" << EOF
{
  "id": "$WORK_ITEM_ID",
  "previousStatus": "$CURRENT_STATUS",
  "startedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
}
EOF
fi
```

This marker file tells the dashboard to show the card's gradient animation. The dashboard automatically clears it when the status changes.

### 2. Ask Clarifying Questions

The goal is to deeply understand what success looks like. Ask about:

- **Scope**: What's included? What's explicitly out of scope?
- **Constraints**: Any technical limitations, deadlines, or requirements?
- **Dependencies**: Does this depend on or affect other work?
- **Acceptance**: How will we know this is done?
- **Edge cases**: What unusual situations should we handle?

Example questions:
- "What's the most important outcome of this work?"
- "Are there specific constraints I should know about?"
- "What does 'done' look like for this feature?"
- "Should we handle [edge case]?"

### 3. Define Success Criteria

Based on the conversation, create specific, verifiable success criteria.

**Good criteria:**
- Specific and measurable
- Verifiable with a clear method
- Independent (can be checked individually)
- Complete (cover all aspects of "done")

**Examples:**
- ✅ "GET /items returns 200 with pagination metadata"
- ✅ "Login fails with 401 for invalid credentials"
- ✅ "All existing tests pass"
- ❌ "API works correctly" (too vague)
- ❌ "Good user experience" (not measurable)

### 4. Update the Work Item

Update the work item file with:

1. **Success Criteria section** - filled with defined criteria
2. **Description section** - expanded with clarifications
3. **Notes section** - any important context from discussion
4. **Status** - change from `new` to `defined`
5. **Workflow** - if specified by user, add `workflow: main` or `workflow: worktree`

```markdown
## Success Criteria

- [ ] [Specific, verifiable outcome 1]
- [ ] [Specific, verifiable outcome 2]
- [ ] [Specific, verifiable outcome 3]
- [ ] All tests pass
- [ ] No type errors
```

Add execution log entry:
```markdown
## Execution Log
- [timestamp] Work item created
- [timestamp] Goals defined, success criteria added
```

### 5. Confirm Definition

Report:
```markdown
## Work Item Defined

**File**: [filename]
**ID**: [id]
**Status**: defined

### Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Next Steps
Run `/flywheel-plan` to create an implementation plan.
```

### 6. Check for Unattended Mode

After confirming the definition, check if the work item should proceed automatically.

**Check condition:**
1. Work item has `- unattended: true` in metadata

```bash
# Check for unattended flag
grep -q "^- unattended: true" "$WORK_ITEM_PATH"
UNATTENDED=$?
```

**If unattended mode is set ($UNATTENDED == 0):**
- Do NOT show "Run `/flywheel-plan`" in Next Steps
- Instead, immediately invoke `/flywheel-plan` using the Skill tool:

```
Use the Skill tool to invoke "flywheel-plan"
```

**If not in unattended mode:**
- Show the standard "Run `/flywheel-plan`" message and stop

## Status Transition

```
new → defined
```

This command ONLY performs this single status transition.

## What This Command Does NOT Do

**NEVER:**
- Write or modify code files (`.ts`, `.tsx`, `.js`, `.json`, `.css`, etc.)
- Create implementation plans (that's `/flywheel-plan`)
- Execute any code changes (that's `/flywheel-execute`)
- Use the Edit or Write tools on non-markdown files
- Create new files in `src/`, `app/`, `lib/`, or any code directory

**ONLY:**
- Read files to understand context
- Ask clarifying questions
- Update the work item markdown file with success criteria
- Change the work item status from `new` to `defined`

## Tips for Good Success Criteria

1. **Start with the end**: What would make you say "yes, this is done"?
2. **Be specific**: Include exact values, endpoints, behaviors
3. **Include verification**: How will you test each criterion?
4. **Don't forget basics**: Tests pass, no type errors, no lint errors
5. **Consider edge cases**: Error handling, empty states, boundary conditions

## If Work Item Already Defined

If status is already `defined` (or later):
- Show current success criteria
- Ask if they want to revise them
- If yes, update criteria and keep status as `defined`
- If no, suggest running `/flywheel-plan`
