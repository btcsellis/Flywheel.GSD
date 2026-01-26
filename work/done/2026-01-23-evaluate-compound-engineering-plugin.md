# Evaluate compound-engineering-plugin

## Metadata
- id: evaluate-compound-engineering-plugin-328
- project: personal/flywheel-gsd
- created: 2026-01-23
- status: done
- workflow: main
- tmux-session: flywheel-gsd
- assigned-session:

## Description

Evaluate the compound-engineering-plugin (https://github.com/EveryInc/compound-engineering-plugin) to determine whether Flywheel should adopt it, adapt specific ideas from it, or skip it entirely.

**Focus area:** The "compound" knowledge capture system - documenting solved problems in a structured `docs/solutions/` directory so future sessions can find and reuse solutions.

**Problem being solved:** Repeated tool/environment errors and Flywheel-specific hangups across different projects (Bellwether, Sophia, etc.). The same issues keep coming up, wasting time on re-discovery.

**Key considerations:**
- Where should solutions live? Per-project, centralized in Flywheel, or both?
- How does this fit with existing Flywheel workflow (backlog → active → done)?
- What's the minimum viable approach to capture learnings?

## Success Criteria

- [x] Written recommendation document with clear verdict: adopt / adapt / skip
- [x] Pros and cons analysis of the compound knowledge capture approach
- [x] Assessment of how solutions storage would work (per-project vs centralized vs hybrid)
- [x] If "adapt": specific proposal for what to add to Flywheel
- [ ] ~~If "adopt": integration steps and any conflicts with current Flywheel workflow~~ (N/A - verdict is ADAPT)

## Notes

**What compound-engineering-plugin offers:**
- 27 agents, 20 commands, 14 skills
- `docs/solutions/` directory with categorized solutions (build-errors/, test-failures/, etc.)
- YAML frontmatter for searchability
- `/workflows:compound` command to document solutions after fixing issues
- Parallel subagents for context analysis, solution extraction, prevention strategies

**Current Flywheel state:**
- Work items flow through backlog → active → done
- No structured knowledge capture for solutions/learnings
- Execution logs exist but aren't searchable across projects

**Research completed:**
- Reviewed `/workflows:compound` command (parallel subagent orchestration)
- Reviewed `/workflows:plan` and `/workflows:work` commands
- Reviewed `compound-docs` skill in detail (7-step process, YAML schema, templates)
- Reviewed existing Flywheel done items (contain learnings in execution logs but not structured/searchable)

## Implementation Plan

### Phase 1: Deep Analysis

1. **Analyze compound-docs architecture**
   - Structure: single markdown file per solution with YAML frontmatter
   - Categories: build-errors/, test-failures/, performance-issues/, etc.
   - Schema: validated enums for problem_type, component, root_cause, severity
   - Template: symptom → failed attempts → solution → why it works → prevention

2. **Compare to Flywheel's current state**
   - Flywheel done items already capture learnings in "Execution Log" and "Notes"
   - Not structured for search (no YAML frontmatter, no categories)
   - Not centralized (each project could have its own)

3. **Assess the problem scope**
   - Tool/environment errors across projects
   - Flywheel-specific hangups
   - Need: searchable, cross-project knowledge base

### Phase 2: Write Recommendation

4. **Create recommendation document**
   - Add recommendation section to this work item
   - Include verdict, pros/cons, storage architecture, specific proposal

5. **Structure the recommendation**
   - Verdict: adopt / adapt / skip
   - Pros and cons analysis
   - Storage architecture recommendation (per-project vs centralized vs hybrid)
   - If adapt: specific proposal for Flywheel integration

### Phase 3: Finalize

6. **Review and validate**
   - Ensure all success criteria are addressed
   - Check recommendation is actionable

### Verification

- Recommendation section exists with clear verdict
- All success criteria checkboxes can be marked complete
- Proposal is specific enough to implement if "adapt" is chosen

## Recommendation

### Verdict: **ADAPT**

Don't adopt the full plugin (it's designed for Claude Code's unreleased plugin system and is heavily Rails-centric). Instead, adapt the core "compound" concept: structured solution capture with minimal overhead.

---

### Pros and Cons Analysis

**Pros of compound-docs approach:**
| Benefit | Why It Matters |
|---------|----------------|
| Structured format | YAML frontmatter enables grep/search by problem_type, component, severity |
| Categorized storage | `docs/solutions/build-errors/` etc. helps find related issues |
| Prevention focus | Each solution includes "how to avoid this next time" |
| Failed attempts documented | Saves time by recording what DIDN'T work |
| Cross-references | Links related solutions together |

**Cons / Concerns:**
| Drawback | Assessment |
|----------|------------|
| Heavy schema | 17 enum values for `problem_type`, 17 for `component` - overkill for your use case |
| Rails-specific | Schema is tailored to Rails/CORA, not generic tool/environment issues |
| Plugin dependency | Requires Claude Code plugin system (not released, format may change) |
| Parallel subagents | Overkill - you don't need 6 parallel agents to document a fix |
| Per-project only | Their model is `docs/solutions/` in each project, not cross-project |

---

### Storage Architecture Recommendation: **HYBRID**

**Centralized in Flywheel for cross-project patterns:**
```
flywheel-gsd/
  solutions/
    tool-environment/     # Claude Code, git, npm, etc.
    flywheel-patterns/    # Flywheel-specific gotchas
```

**Per-project for project-specific issues:**
```
bellwether/
  docs/solutions/         # Bellwether-specific issues
sophia/
  docs/solutions/         # Sophia-specific issues
```

**Rationale:**
- Your problem is "same errors across projects" → central storage solves this
- Some issues ARE project-specific → keep those local
- Flywheel is already your cross-project coordination hub

---

### Specific Proposal: Minimal `/flywheel-learn` Skill

Add a single new skill to capture learnings with minimal friction:

**1. Add `/flywheel-learn` command**

Triggers after a problem is solved. Captures:
- **Problem**: What went wrong (error message, symptom)
- **Solution**: What fixed it
- **Prevention**: How to avoid next time

**2. Simplified schema (not the 17-enum monster)**

```yaml
---
date: 2026-01-23
category: tool | environment | flywheel | project-specific
tags: [git, worktree, cleanup]
---

# Worktree cleanup fails when cwd is inside worktree

## Problem
`git worktree remove` fails with "Path does not exist" errors when shell cwd is inside the worktree being removed.

## Solution
1. cd to main repo FIRST: `cd $(git worktree list | head -1 | awk '{print $1}')`
2. Run `git worktree prune` before removal
3. If `git worktree remove` fails, use `rm -rf` as fallback

## Prevention
Always cd out of a directory before deleting it. This applies to worktrees, temp dirs, anything.
```

**3. Storage location**

```
flywheel-gsd/solutions/
  tool-environment/
    worktree-cleanup-cwd-issue.md
    git-permission-denied-fix.md
  flywheel-patterns/
    status-transition-order.md
```

**4. Integration with existing workflow**

- After `/flywheel-done` completes, optionally prompt: "Learned something worth capturing? Run `/flywheel-learn`"
- During `/flywheel-execute`, search `solutions/` for relevant prior learnings before starting

**5. No parallel subagents needed**

The compound-engineering-plugin uses 6 parallel agents to capture a solution. That's overkill. A simple structured template filled by the main Claude session is sufficient.

---

### What NOT to Adopt

| Feature | Skip Because |
|---------|--------------|
| YAML schema validation with 17+ enums | Too rigid, adds friction |
| Parallel subagent orchestration | Overkill for simple documentation |
| Rails-specific categories | Not relevant to your tool/environment issues |
| Plugin system format | Unreleased, may change |
| `/workflows:*` command structure | You already have `/flywheel-*` |

---

### Implementation Effort

If you want to proceed with this adaptation:

1. **Create `solutions/` directory** in flywheel-gsd (5 min)
2. **Write `/flywheel-learn` skill** - simple template fill (30 min)
3. **Add search to `/flywheel-execute`** - grep solutions before starting (15 min)
4. **Optional: Add prompt to `/flywheel-done`** - ask about learnings (10 min)

Total: ~1 hour to get basic knowledge capture working.

---

## Execution Log

- 2026-01-23T20:38:31.025Z Work item created
- 2026-01-23T20:45:00.000Z Goals defined, success criteria added
- 2026-01-23T20:55:00.000Z Implementation plan created (research task, no code changes)
- 2026-01-23T21:00:00.000Z Transitioned to executing, moved to active/
- 2026-01-23T21:05:00.000Z Completed deep analysis of compound-docs architecture
- 2026-01-23T21:10:00.000Z Wrote recommendation with verdict: ADAPT
- 2026-01-23T21:12:00.000Z All success criteria verified, ready for /flywheel-done
- 2026-01-23T21:15:00.000Z Work item completed (research task, shipped to main)
