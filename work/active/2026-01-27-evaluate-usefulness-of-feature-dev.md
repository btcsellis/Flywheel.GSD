# Evaluate usefulness of /feature-dev

## Metadata
- id: evaluate-usefulness-of-feature-dev-617
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: review
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-evaluate-usefulness-of-feature-dev-617
- assigned-session: 

## Description

Evaluate the `feature-dev` skill (guided feature development with codebase understanding and architecture focus) to determine if it adds value to the flywheel-gsd workflow. The skill includes sub-agents: `code-reviewer`, `code-explorer`, and `code-architect`. Review what it does, how it works, and whether it saves time or produces better outcomes compared to the current flywheel workflow. Recommend whether to integrate it into the standard workflow, offer it as optional, or skip it.

## Success Criteria

- [x] Document what the `feature-dev` skill and its sub-agents (`code-reviewer`, `code-explorer`, `code-architect`) do
- [x] Identify overlap and gaps between `feature-dev` capabilities and existing flywheel skills (`/flywheel-plan`, `/flywheel-execute`)
- [x] Assess whether `feature-dev` would save time or improve outcomes for typical flywheel work items
- [x] Provide a clear recommendation: integrate into standard workflow, offer as optional, or skip
- [x] If recommending integration, outline where it fits in the flywheel lifecycle (e.g., between define and plan, during execute, etc.)

## Implementation Plan

### Phase 1: Document feature-dev capabilities

1. **Catalog feature-dev and its sub-agents**
   - Document what the main `feature-dev` skill does (guided feature development flow)
   - Document `code-explorer`: codebase analysis, execution path tracing, architecture mapping
   - Document `code-architect`: feature architecture design, implementation blueprints
   - Document `code-reviewer`: bug detection, security review, code quality, confidence-based filtering
   - Note which tools each sub-agent has access to (read-only vs read-write)

### Phase 2: Compare with existing flywheel skills

2. **Map feature-dev capabilities to flywheel lifecycle stages**
   - Compare `code-explorer` with exploration done in `/flywheel-plan`
   - Compare `code-architect` with planning done in `/flywheel-plan`
   - Compare `code-reviewer` with verification done in `/flywheel-execute`
   - Identify what feature-dev offers that flywheel currently lacks
   - Identify what flywheel does that feature-dev doesn't cover

### Phase 3: Assess value and write recommendation

3. **Evaluate time savings and outcome quality**
   - Assess whether feature-dev's exploration phase is deeper/better than flywheel-plan's
   - Assess whether code-architect produces more actionable plans
   - Assess whether code-reviewer catches issues that flywheel-execute verification misses
   - Consider overhead: does invoking feature-dev add unnecessary steps?

4. **Write recommendation**
   - Recommend: integrate, optional, or skip
   - If integrating, specify where in the lifecycle (e.g., code-explorer before /flywheel-plan, code-reviewer during /flywheel-execute)
   - Document the recommendation in the work item Notes section

### Verification

- All 5 success criteria addressed in the Notes section
- Recommendation is clear and actionable

## Notes

### Feature-dev capabilities

The `feature-dev` skill is a Claude Code built-in that provides guided feature development. It decomposes into three read-only sub-agents:

| Sub-agent | Purpose | Tools |
|-----------|---------|-------|
| `code-explorer` | Traces execution paths, maps architecture layers, documents dependencies | Read-only: Glob, Grep, LS, Read, WebFetch, WebSearch |
| `code-architect` | Designs feature architectures, produces implementation blueprints (files to create/modify, component designs, data flows, build sequences) | Read-only (same) |
| `code-reviewer` | Reviews code for bugs, logic errors, security vulns, code quality; uses confidence-based filtering to surface only high-priority issues | Read-only (same) |

All sub-agents are read-only — they analyze but never modify code.

### Overlap with flywheel skills

| Capability | Flywheel equivalent | feature-dev equivalent | Overlap? |
|------------|---------------------|----------------------|----------|
| Codebase exploration | `/flywheel-plan` (step 2: explore codebase) | `code-explorer` | **High** — both read files, trace patterns, map architecture |
| Implementation design | `/flywheel-plan` (step 3: design approach) | `code-architect` | **High** — both produce file-level plans with phases and steps |
| Code review / verification | `/flywheel-execute` (step 5: verify success criteria) | `code-reviewer` | **Medium** — flywheel verifies via running tests/typecheck; code-reviewer does static analysis for bugs/security |
| Guided interactive flow | `/flywheel-define` (ask questions, clarify scope) | `feature-dev` main skill | **Medium** — both involve Q&A to clarify requirements |

### Gaps

**What feature-dev adds that flywheel lacks:**
- `code-reviewer` provides dedicated static analysis for bugs, security vulns, and code quality — flywheel only runs automated checks (tests, typecheck, lint) but doesn't do a dedicated code review pass
- `code-explorer` runs as a specialized agent with focused context, potentially producing deeper architectural analysis than the ad-hoc exploration in `/flywheel-plan`

**What flywheel has that feature-dev lacks:**
- Full lifecycle management (status tracking, work item files, execution logs, git/PR workflow, archiving, cleanup)
- Browser verification for frontend changes
- Unattended mode for chaining stages
- Prior learnings search from `solutions/` directory
- Worktree management

### Assessment: time savings and outcome quality

**Time savings: Marginal.** The flywheel workflow already explores the codebase and creates plans. Using `code-explorer` or `code-architect` as Task sub-agents would add an extra round of analysis that largely duplicates what `/flywheel-plan` already does. The main skill's guided Q&A flow also overlaps with `/flywheel-define`.

**Outcome quality: Modest improvement possible.** The `code-reviewer` sub-agent is the most valuable addition — it provides a dedicated code review pass with confidence-based filtering that flywheel currently lacks. This could catch bugs or security issues before `/flywheel-done` creates a PR. The `code-explorer` agent could produce slightly more structured codebase analysis, but the difference is unlikely to be significant given that `/flywheel-plan` already reads and analyzes code.

**Overhead concern:** Invoking the full `feature-dev` skill adds an interactive guided flow that conflicts with flywheel's structured lifecycle. The sub-agents are more useful individually than as a bundle.

### Recommendation

**Offer `code-reviewer` as optional; skip the rest.**

- **`code-reviewer`** — Worth integrating as an optional step in `/flywheel-execute`, invoked after implementation and before transitioning to `review`. It catches static analysis issues (bugs, security, code quality) that automated tests miss. Add it as a Task sub-agent call, not as a full skill invocation.
  - **Where it fits:** Between implementation (step 3) and success criteria verification (step 5) in `/flywheel-execute`. Or as a pre-PR check in `/flywheel-done`.
- **`code-explorer`** — Skip. The exploration in `/flywheel-plan` is sufficient. Using a separate agent for this adds overhead without meaningful improvement.
- **`code-architect`** — Skip. The planning step in `/flywheel-plan` already produces file-level implementation blueprints. Duplicating this with a separate agent adds no value.
- **`feature-dev` main skill** — Skip. Its guided Q&A flow conflicts with flywheel's defined lifecycle stages. Flywheel already separates define → plan → execute.

**Integration outline for `code-reviewer`:**
1. In `/flywheel-execute`, after all implementation steps complete (step 3 done)
2. Invoke `feature-dev:code-reviewer` as a Task sub-agent on the changed files
3. If high-confidence issues found, fix them before proceeding to success criteria verification
4. Log review results in the execution log

## Execution Log

- 2026-01-27T23:41:06.995Z Work item created
- 2026-01-27T23:45:00.000Z Goals defined, success criteria added
- 2026-01-27T23:48:00.000Z Implementation plan created
- 2026-01-27T23:52:00.000Z Executed: documented feature-dev capabilities, compared with flywheel, wrote recommendation
- 2026-01-27T23:52:00.000Z All success criteria verified
- 2026-01-27T23:52:00.000Z Ready for /flywheel-done
