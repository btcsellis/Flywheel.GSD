# Flywheel: Execute Plan

Execute the implementation plan autonomously, transitioning `planned` → `review` (items stay in `planned` during execution).

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

Or find a `planned` work item:
```bash
for file in "$FLYWHEEL_PATH/work/backlog/"*.md "$FLYWHEEL_PATH/work/active/"*.md; do
  if grep -q "^- status: planned" "$file" 2>/dev/null; then
    echo "Found: $file"
    cat "$file"
  fi
done
```

Read the work item to understand:
- The implementation plan
- Success criteria
- Current progress (if resuming)

### 1a. Mark as Transitioning (Dashboard Animation)

Create or update the transitioning marker file so the dashboard shows the gradient animation. Always write the marker with the current status, even if one already exists, to ensure each skill phase has the correct `previousStatus`.

```bash
# Extract work item ID and current status
WORK_ITEM_ID=$(grep "^- id:" "$WORK_ITEM_PATH" | cut -d: -f2 | xargs)
CURRENT_STATUS=$(grep "^- status:" "$WORK_ITEM_PATH" | cut -d: -f2 | xargs)

# Always create/update the marker with current status
cat > "$FLYWHEEL_PATH/.flywheel-transitioning-$WORK_ITEM_ID" << EOF
{
  "id": "$WORK_ITEM_ID",
  "previousStatus": "$CURRENT_STATUS",
  "startedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
}
EOF
```

This marker file tells the dashboard to show the card's gradient animation. The dashboard automatically clears it when the status changes.

### 2. Prepare for Execution

Items remain in `planned` status during execution (with gradient animation in the dashboard).

Move to active folder if still in backlog:
```bash
if [[ "$WORK_ITEM_PATH" == *"/backlog/"* ]]; then
  mv "$WORK_ITEM_PATH" "$FLYWHEEL_PATH/work/active/"
fi
```

### 2a. Search Prior Learnings

Before starting work, search for relevant solutions from past issues.

**Extract keywords from work item:**
- Title words
- Tags from description
- Key technical terms

**Search solutions directory:**
```bash
# Search for matches in solutions/
grep -r -l "keyword" "$FLYWHEEL_PATH/solutions/" 2>/dev/null
```

**If matches found, display them:**

```markdown
## Prior Learnings Found

Found [N] potentially relevant solution(s):

### 1. [Title from solution file]
**Problem:** [First line of Problem section]
**File:** `solutions/[category]/[filename].md`

### 2. [Title from solution file]
...

Review these before proceeding to avoid repeating past mistakes.
```

**If no matches found:**
Silently continue - don't mention if nothing relevant.

### 2b. Check Chrome Plugin (if Browser Verification Required)

If the work item contains a `## Browser Verification` section, the Chrome plugin is required.

**Check availability:**
1. Call `mcp__claude-in-chrome__tabs_context_mcp`
2. If the call succeeds → Chrome plugin is available, continue
3. If the call fails/errors → Chrome plugin is unavailable, **FAIL EXECUTION**

**If Chrome plugin unavailable:**
```markdown
## Blocked

**Issue:** Chrome plugin required but unavailable
**Reason:** This work item includes frontend changes that require browser verification.
**Required:**
- Chrome browser must be running
- Claude in Chrome extension must be installed and active
- The MCP connection must be established

Please ensure the Chrome plugin is available and run `/flywheel-execute` again.
```

Update status to blocked and stop execution. Do not proceed without browser verification capability for frontend work items.

### 2c. Detect Worktree Port (if Browser Verification Required)

If the work item contains a `## Browser Verification` section and the current directory is a git worktree (not the main working tree), find an available port for the dev server.

**Detect worktree:**
```bash
# Check if current directory is a worktree (not the main working tree)
MAIN_WORKTREE=$(git worktree list | head -1 | awk '{print $1}')
CURRENT_DIR=$(pwd)

if [ "$CURRENT_DIR" != "$MAIN_WORKTREE" ]; then
  IS_WORKTREE=true
else
  IS_WORKTREE=false
fi
```

**Find available port (worktree only):**
```bash
if [ "$IS_WORKTREE" = true ]; then
  DEV_PORT=3001
  while lsof -i :$DEV_PORT >/dev/null 2>&1; do
    DEV_PORT=$((DEV_PORT + 1))
    if [ $DEV_PORT -gt 3010 ]; then
      echo "ERROR: No available port found between 3001-3010"
      break
    fi
  done
  echo "Using port $DEV_PORT for worktree dev server"
else
  DEV_PORT=3000
fi
```

**Start dev server with detected port:**
- In worktree: `npm run dev -- --port $DEV_PORT`
- On main: `npm run dev` (default port 3000)

**Use `http://localhost:$DEV_PORT` for all browser verification navigate calls** instead of hardcoded `http://localhost:3000`.

### 3. Execute Loop

For each step in the implementation plan:

```
┌─────────────────────────────────────────────┐
│  DO THE WORK                                │
│  - Implement the checklist item             │
│  - Update work item: add execution log      │
├─────────────────────────────────────────────┤
│  VERIFY                                     │
│  - Run automated checks (typecheck, test)   │
│  - Run specific verification for this step  │
├─────────────────────────────────────────────┤
│  PASS?                                      │
│  ├─ YES → Continue to next item             │
│  └─ NO  → Analyze failure, fix, re-verify   │
│           Loop until pass (max 3 attempts)  │
└─────────────────────────────────────────────┘
```

### 4. Update Work Item Progress

After completing each major step, update the execution log:

```bash
echo "- [$(date +%Y-%m-%d\ %H:%M)] Completed: [step description]" >> "$WORK_ITEM_PATH"
```

### 5. Verify Success Criteria

After all implementation steps, verify each success criterion:

```
For each criterion in Success Criteria:
  - Run its verification method
  - If PASS: mark as [x], continue
  - If FAIL:
    - Log the failure in Execution Log
    - Analyze what's wrong
    - Fix the issue
    - Re-run verification
    - Max 3 fix attempts per criterion
```

Update the success criteria checkboxes in the work item:
- `[ ]` → `[x]` for completed criteria

### 5a. Execute Browser Verification (if present)

If the work item contains a `## Browser Verification` section, execute those steps using the Chrome plugin.

**Process:**
1. Ensure dev server is running (check prerequisites in Browser Verification section)
2. Get tab context: `mcp__claude-in-chrome__tabs_context_mcp`
3. Create a new tab: `mcp__claude-in-chrome__tabs_create_mcp`
4. For each verification step:
   - **Navigate**: Use `mcp__claude-in-chrome__navigate` to go to URLs
   - **Find elements**: Use `mcp__claude-in-chrome__find` to locate elements by description
   - **Read page**: Use `mcp__claude-in-chrome__read_page` to get page structure
   - **Interact**: Use `mcp__claude-in-chrome__computer` for clicks, typing, etc.
   - **Screenshot**: Use `mcp__claude-in-chrome__computer` with action "screenshot" to capture state
5. Log results in execution log

**Example execution:**
```
1. Navigate to http://localhost:$DEV_PORT/dashboard (use port from step 2c; default 3000)
   → mcp__claude-in-chrome__navigate(url="http://localhost:$DEV_PORT/dashboard", tabId=X)

2. Verify "Work Items" heading is visible
   → mcp__claude-in-chrome__find(query="Work Items heading", tabId=X)
   → If found: PASS, if not found: FAIL

3. Click "New" button
   → mcp__claude-in-chrome__find(query="New button", tabId=X)
   → mcp__claude-in-chrome__computer(action="left_click", ref="ref_X", tabId=X)

4. Verify modal appears
   → mcp__claude-in-chrome__read_page(tabId=X)
   → Check for modal elements in response
```

**On verification failure:**
- Log the failure with screenshot if possible
- Attempt to fix the issue (max 3 attempts)
- If still failing after 3 attempts, mark as blocked

### 6. Transition to Review

When ALL success criteria are verified:

Update status:
```bash
sed -i '' 's/- status: planned/- status: review/' "$WORK_ITEM_PATH"
```

Add completion entry to execution log:
```markdown
- [timestamp] All success criteria verified
- [timestamp] Ready for /flywheel-done
```

### 7. Report

```markdown
## Execution Complete

### Success Criteria Results
| # | Criterion | Result |
|---|-----------|--------|
| 1 | [criterion] | ✅ |
| 2 | [criterion] | ✅ |

### Summary
- Implementation steps completed: X/Y
- Issues encountered and fixed: [list]

### Work Item Status
- File: [filename]
- Status: review

### Next Steps
Run `/flywheel-done` to commit, push, create PR, and archive.
```

## Rules

1. **Don't ask permission between steps** - keep working until blocked or complete
2. **Always update the work item** - execution log should tell the full story
3. **Fix failures immediately** - don't skip and continue
4. **Log everything** - timestamps and descriptions for each step
5. **Stop after 3 failed attempts** on same issue - report what's blocking

## If Blocked

Stop and report clearly:

```markdown
## Blocked

**Issue:** [What's preventing progress]
**Attempts:** [What was tried]
**Need:** [What input/decision is required]
```

Update the work item:
```bash
sed -i '' 's/- status: planned/- status: blocked/' "$WORK_ITEM_PATH"
echo "- [$(date +%Y-%m-%d\ %H:%M)] BLOCKED: [reason]" >> "$WORK_ITEM_PATH"
```

## Status Transitions

```
planned → review
```

Or if blocked:
```
planned → blocked
```

## Arguments

- `/flywheel-execute` - Run the full plan
- `/flywheel-execute step N` - Run only step N
- `/flywheel-execute verify` - Only run verification, no implementation
- `/flywheel-execute resume` - Continue from last logged progress

## If Work Item Not Planned

If status is `new`:
- Suggest running `/flywheel-define` first

If status is `defined`:
- Suggest running `/flywheel-plan` first

If status is already `review` or `done`:
- Show that execution is complete
- Suggest running `/flywheel-done`
