# Determine usefulness of hooks

## Metadata
- id: determine-usefulness-of-hooks-699
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: review
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Research Claude Code hooks to identify high-value opportunities for flywheel-gsd. Focus on:
- **Velocity**: Remove speed bumps (permission prompts, manual commands)
- **Reliability**: Deterministic QA checks (invalid statuses, missing fields)
- **Architecture**: How should flywheel-gsd implement hooks generally?

Research approach:
- Official Claude Code docs for hook capabilities
- Community discussions for practical use cases and patterns

Output: Prioritized list of hook ideas with recommendations, decide which to create as work items.

## Success Criteria

- [x] Documented understanding of Claude Code hook types and capabilities
- [x] Research of community patterns and use cases
- [x] Architectural recommendation: how flywheel-gsd should organize/manage hooks
- [x] Prioritized list of 3-5 high-value hook ideas for flywheel
- [x] Each idea includes: problem it solves, hook type, rough implementation approach
- [x] Recommendations presented for user to select which become work items

## Notes

Priority is velocity and reliability, not quantity of hooks. Start with high-value ideas, can expand later.

## Implementation Plan

### Phase 1: Research Hook Capabilities

1. **Research official Claude Code hooks documentation**
   - Fetch official docs on hooks
   - Document hook types, events, capabilities
   - Note any limitations or constraints

2. **Review existing flywheel hooks setup**
   - Check `~/.claude/hooks/` for any existing hooks
   - Understand current hook infrastructure

### Phase 2: Community Research

3. **Search for community patterns and use cases**
   - Web search for Claude Code hooks discussions
   - Look for practical examples and patterns
   - Note high-value use cases others have found

### Phase 3: Analysis and Recommendations

4. **Develop architectural recommendation**
   - Where should flywheel hooks live?
   - How should they be organized?
   - What's the pattern for adding new hooks?

5. **Create prioritized list of hook ideas**
   - Identify 3-5 high-value hooks for flywheel
   - For each: problem, hook type, implementation approach
   - Prioritize by velocity/reliability impact

6. **Present recommendations**
   - Document findings in work item
   - Present options for user to select which become work items

### Verification

- All success criteria documented in the work item
- Recommendations are actionable and prioritized

## Execution Log

- 2026-01-26T13:35:01.480Z Work item created
- 2026-01-26T13:38:00Z Goals defined, success criteria added
- 2026-01-26T13:40:00Z Implementation plan created
- 2026-01-26T13:45:00Z Phase 1: Researched official hooks documentation
- 2026-01-26T13:46:00Z Phase 2: Researched community patterns and use cases
- 2026-01-26T13:48:00Z Phase 3: Analysis and recommendations complete

---

## Research Findings

### Claude Code Hook Types & Capabilities

**12 Hook Events Available:**

| Hook | When | Can Block? | Key Use |
|------|------|-----------|---------|
| **SessionStart** | Session begins/resumes | No | Load context, set env vars |
| **UserPromptSubmit** | User submits prompt | Yes | Validate prompts, add context |
| **PreToolUse** | Before tool runs | Yes | Block/allow tools, modify inputs |
| **PermissionRequest** | Permission dialog shown | Yes | Auto-allow/deny permissions |
| **PostToolUse** | After tool succeeds | No | Format code, validate output |
| **PostToolUseFailure** | After tool fails | No | Handle errors, log |
| **SubagentStart** | Spawning subagent | No | Initialize resources |
| **SubagentStop** | Subagent finishes | Yes | Evaluate completion |
| **Stop** | Claude finishes responding | Yes | Force continuation |
| **PreCompact** | Before context compaction | No | Monitor compaction |
| **Setup** | During init/maintenance | No | Install deps, migrations |
| **Notification** | Sending notifications | No | Custom notification delivery |

**Configuration:** Hooks in `settings.json` (user: `~/.claude/settings.json`, project: `.claude/settings.json`)

**Control mechanisms:**
- Exit code 0: Success, stdout processed
- Exit code 2: Block action, stderr shown to Claude
- JSON output: `permissionDecision`, `updatedInput`, `additionalContext`, `decision`

### Community Patterns

**High-value patterns from community:**
1. **Deterministic security** - Block dangerous commands via PreToolUse (not LLM decisions)
2. **Auto-formatting** - PostToolUse runs prettier/gofmt after edits
3. **Context injection** - SessionStart loads git status, project context
4. **Branch protection** - PreToolUse blocks edits on main branch
5. **Skill suggestion** - UserPromptSubmit analyzes prompts and suggests skills

**Key insight:** Hooks replace probabilistic LLM decisions with deterministic rules.

---

## Architectural Recommendation

### Where Flywheel Hooks Should Live

```
flywheel-gsd/
├── hooks/                    # Flywheel hook scripts
│   ├── work-item-validation.sh
│   ├── status-validation.sh
│   └── auto-permission.sh
├── .claude/
│   └── settings.json         # Hook configuration (references hooks/)
```

**Rationale:**
- Scripts in `flywheel-gsd/hooks/` - version controlled, portable
- Config in `.claude/settings.json` - standard Claude Code location
- Symlinks from `~/.claude/hooks/` if needed globally

### Pattern for Adding Hooks

1. Create script in `flywheel-gsd/hooks/`
2. Add hook configuration to `.claude/settings.json`
3. Document in CLAUDE.md
4. Test with `/hooks` command

---

## Prioritized Hook Ideas for Flywheel

### 1. **Work Item Status Validation** (HIGH VALUE - Reliability)

**Problem:** Invalid statuses slip through (you mentioned "statuses that don't exist"). Currently relies on prompts to enforce valid status transitions.

**Hook type:** `PreToolUse` on `Edit` tool

**How it works:**
- When editing a work item file, hook checks if new status is valid
- Validates status transitions: `new→defined→planned→executing→review→done`
- Blocks invalid transitions with error message

**Implementation:**
```bash
# PreToolUse hook
# Check if file is work item (work/*/\*.md)
# Parse old and new status
# Validate transition is allowed
# Exit 2 to block if invalid
```

**Impact:** Deterministically prevents invalid states. No more debugging weird status values.

---

### 2. **Auto-Permission for Flywheel Commands** (HIGH VALUE - Velocity)

**Problem:** Permission prompts slow down flywheel workflow. You're constantly approving `git add`, `git commit`, `mv` for work items, etc.

**Hook type:** `PermissionRequest`

**How it works:**
- Auto-allow specific patterns for flywheel operations:
  - `Bash(git *)` in flywheel-gsd directory
  - `Bash(mv work/*)`
  - `Edit` on `work/**/*.md` files
- Still prompt for non-flywheel operations

**Implementation:**
```bash
# PermissionRequest hook
# Check if command matches flywheel patterns
# If yes: output {"permissionDecision": "allow"}
# If no: output {"permissionDecision": "ask"}
```

**Impact:** Removes 80%+ of permission prompts during flywheel workflows.

---

### 3. **Unattended Mode via Hook** (MEDIUM-HIGH VALUE - Velocity)

**Problem:** You just implemented unattended mode in prompts, but prompts are fragile. Hook-based would be more reliable.

**Hook type:** `Stop`

**How it works:**
- When Claude finishes, hook checks if current work item has `unattended: true`
- If yes and status is `defined` → output `{"decision": "block"}` and context to run `/flywheel-plan`
- If yes and status is `planned` → output `{"decision": "block"}` and context to run `/flywheel-execute`
- If status is `review` or no unattended flag → let stop happen

**Implementation:**
```bash
# Stop hook
# Read current work item from .flywheel-prompt-*.txt
# Check unattended flag and status
# If should continue: exit 2 with instruction
# If done: exit 0
```

**Impact:** More reliable unattended execution. Could replace the prompt-based implementation.

---

### 4. **SessionStart Context Loading** (MEDIUM VALUE - Velocity)

**Problem:** Each new session, Claude doesn't know flywheel state. Has to re-discover active work items.

**Hook type:** `SessionStart`

**How it works:**
- On session start, hook reads flywheel state
- Outputs context: active work items, current status, recent execution log
- Claude starts with full context

**Implementation:**
```bash
# SessionStart hook
# Read work/active/*.md
# Format as context for Claude
# Output to stdout (becomes additionalContext)
```

**Impact:** Faster session startup, less re-discovery.

---

### 5. **Work Item Field Validation** (MEDIUM VALUE - Reliability)

**Problem:** Work items can be created with missing required fields (no id, no project, etc.)

**Hook type:** `PostToolUse` on `Write` or `Edit` to work item files

**How it works:**
- After writing/editing a work item, validate required fields exist:
  - `id:` present
  - `project:` present and valid
  - `status:` present and valid
  - `## Success Criteria` section exists
- Provide feedback to Claude if validation fails

**Implementation:**
```bash
# PostToolUse hook
# Parse work item markdown
# Check required fields
# Output feedback if missing
```

**Impact:** Catches malformed work items early. Non-blocking but informative.

---

## Summary: Recommended Priority

| # | Hook | Impact | Effort | Recommendation |
|---|------|--------|--------|----------------|
| 1 | Status Validation | High (reliability) | Low | **Implement first** |
| 2 | Auto-Permission | High (velocity) | Medium | **Implement second** |
| 3 | Unattended via Hook | Medium-High | Medium | Consider replacing prompt version |
| 4 | SessionStart Context | Medium | Low | Nice to have |
| 5 | Field Validation | Medium | Low | Nice to have |

**Recommendation:** Start with #1 (Status Validation) and #2 (Auto-Permission). These give the highest velocity/reliability gains with reasonable effort.

---

## Sources

- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)
- [claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery)
- [claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase)
