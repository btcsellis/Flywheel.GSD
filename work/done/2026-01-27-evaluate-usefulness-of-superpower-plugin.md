# Evaluate usefulness of Superpowers plugin

## Metadata
- id: evaluate-usefulness-of-superpower-plugin-122
- project: personal/flywheel-gsd
- created: 2026-01-27
- status: done
- unattended: true
- workflow: worktree
- tmux-session: flywheel-flywheel-gsd-evaluate-usefulness-of-superpower-plugin-122
- assigned-session:

## Description

Evaluate whether the [Superpowers](https://github.com/obra/superpowers) Claude Code plugin (by Jesse Vincent) would add value to the Flywheel.GSD workflow. Superpowers provides a brainstorm→plan→execute workflow with TDD enforcement, systematic debugging, and 2-stage code review.

**Conclusion: Don't install. Cherry-pick 3 ideas as Flywheel enhancements.**

The core workflow (brainstorm→plan→execute with subagents) is redundant with Flywheel's existing define→plan→execute pipeline. Installing both would create competing instruction sets. However, three capabilities are worth adopting natively:

1. **TDD enforcement** — Require tests before implementation in `/flywheel-execute`
2. **Structured debugging** — Replace blind retries with 4-phase root cause analysis
3. **Self-review step** — Add spec compliance + quality check before `review` status

Flywheel already exceeds Superpowers in: work item lifecycle, dashboard, permissions, learnings capture, worktree orchestration, browser verification, and unattended chaining.

## Success Criteria

- [x] Identified what Superpowers provides (features, skills, philosophy)
- [x] Compared capabilities with Flywheel.GSD's existing workflow
- [x] Identified overlap and unique value
- [x] Made a clear recommendation with rationale
- [x] Identified actionable follow-up items

## Notes

- Superpowers has 29k+ GitHub stars, accepted into Anthropic plugin marketplace Jan 2026
- Token-light design (~2k tokens core), loads skills on demand via shell script
- Personal skills can shadow core skills via `~/.config/superpowers/skills/`
- Sources: [GitHub repo](https://github.com/obra/superpowers), [Author's blog](https://blog.fsck.com/2025/10/09/superpowers/), [Dev Genius explainer](https://blog.devgenius.io/superpowers-explained-the-claude-plugin-that-enforces-tdd-subagents-and-planning-c7fe698c3b82)

## Execution Log

- 2026-01-27T23:43:51.001Z Work item created
- 2026-01-27T23:50:00.000Z Goals defined, success criteria added. Research-only task — all criteria met during define phase.
- 2026-01-27T23:55:00.000Z Work item completed (research-only, no code changes)
