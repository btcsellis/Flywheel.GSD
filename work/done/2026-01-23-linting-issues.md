# Linting issues

## Metadata
- id: linting-issues-418
- project: sophia/Sophia.Roadmap
- created: 2026-01-23
- status: done
- workflow: worktree
- tmux-session: flywheel-Sophia-Roadmap-linting-issues-418
- assigned-session:

## Description

When executing my last plan, I got these errors. Let's fix them (and any others you detect).

⏺ Bash(pwd && uv run ruff check .)
  ⎿  Error: Exit code 2
     error: Failed to spawn: `ruff`
       Caused by: No such file or directory (os error 2)

     /Users/stevenellis/sophia/Sophia.Roadmap-worktrees/relate-features-to-github-repos-124/api

⏺ Bash(uv pip install ruff && uv run ruff check .)
  ⎿  Error: Exit code 1
     Resolved 1 package in 228ms
     Downloading ruff (9.8MiB)
      Downloaded ruff
     Prepared 1 package in 242ms
     Installed 1 package in 4ms
      + ruff==0.14.14
     warning: Invalid `# noqa` directive on alembic/env.py:12: expected a comma-separated list of codes (e.g., `# noqa: F401, F841`).

     F403 `from app.models import *` used; unable to detect undefined names
     … +275 lines (ctrl+o to see all)

⏺ These are pre-existing linting issues, not from my changes. Let me verify that the backend API works by testing an import.

## Success Criteria

- [x] `uv run ruff check .` passes with zero errors in `api/`
- [x] `uv run ruff format --check .` passes in `api/`
- [x] Ruff configuration added to `api/pyproject.toml` with appropriate rules
- [x] `npm run lint` passes with zero errors in `web/`
- [x] `uv run pytest` passes (no regressions from lint fixes)
- [x] Backend API starts successfully (`uv run uvicorn app.main:app`)

## Notes

- Use `ruff check --fix` for auto-fixable issues
- Fix aggressively, rely on tests to catch any breakage
- Address both Python (ruff) and TypeScript/Vue (eslint) linting

## Implementation Plan

### Phase 1: Backend Ruff Configuration

1. **Enhance ruff config in `api/pyproject.toml`**
   - Add explicit lint rules selection (E, F, W, I for imports)
   - Configure per-file ignores for alembic and tests
   - Add ruff format settings
   - Verification: Config syntax valid

### Phase 2: Fix Python Linting Errors (24 total)

2. **Auto-fix F401 unused imports (11 errors)**
   - Run `uv run ruff check . --fix --select F401`
   - Files: exceptions.py, command_center.py, activity_service.py, comment_service.py, conftest.py, test_*.py
   - Verification: `ruff check . --select F401` returns 0 errors

3. **Fix E712 boolean comparisons (8 errors)**
   - Replace `== True` with identity check
   - Replace `== False` with `is False` or `not x`
   - Files: admin.py, command_center.py, comment_service.py, roadmap_service.py, vote_service.py
   - Verification: `ruff check . --select E712` returns 0 errors

4. **Fix E741 ambiguous variable names (3 errors)**
   - Rename `l` to `label` in github.py list comprehensions
   - Verification: `ruff check . --select E741` returns 0 errors

5. **Fix E711 None comparison (1 error)**
   - Change `== None` to `is None`
   - Verification: `ruff check . --select E711` returns 0 errors

6. **Fix F403 star import in alembic/env.py**
   - Fix noqa directive syntax: `# noqa: F401, F403`
   - Verification: No warning on alembic/env.py

### Phase 3: Frontend ESLint Setup

7. **Create eslint.config.js for ESLint 9.x flat config**
   - Configure for Vue 3 + TypeScript
   - Include vue, typescript-eslint plugins
   - Integrate prettier config
   - Verification: `npm run lint` runs without config errors

8. **Fix any ESLint errors**
   - Run `npm run lint -- --fix` for auto-fixable issues
   - Manually fix remaining issues
   - Verification: `npm run lint` passes

### Phase 4: Verification

9. **Run full backend checks**
   - `uv run ruff check .` - zero errors
   - `uv run ruff format --check .` - passes
   - `uv run pytest` - all tests pass
   - Start uvicorn and verify imports work

10. **Run full frontend checks**
    - `npm run lint` - zero errors
    - `npm run build` - builds successfully

## Files to Modify

**Backend (api/):**
- `pyproject.toml` - ruff configuration
- `alembic/env.py` - fix noqa directive
- `app/exceptions.py` - remove unused import
- `app/routers/admin.py` - fix boolean comparison
- `app/routers/command_center.py` - remove unused imports, fix boolean
- `app/routers/github.py` - rename ambiguous variables
- `app/services/activity_service.py` - remove unused import
- `app/services/comment_service.py` - remove unused imports, fix boolean
- `app/services/roadmap_service.py` - fix boolean comparisons
- `app/services/vote_service.py` - fix boolean comparisons
- `tests/conftest.py` - remove unused import
- `tests/test_comments.py` - remove unused import
- `tests/test_roadmap.py` - remove unused import
- `tests/test_votes.py` - remove unused import

**Frontend (web/):**
- `eslint.config.js` - new file for ESLint 9.x flat config
- Various `.vue`/`.ts` files - fix any lint errors found

## Execution Log

- 2026-01-23T14:46:12.270Z Work item created
- 2026-01-23 Goals defined, success criteria added
- 2026-01-23 Implementation plan created
- 2026-01-23 Execution started
- 2026-01-23 Phase 1: Added ruff lint configuration to pyproject.toml (E, F, W, I rules + per-file ignores)
- 2026-01-23 Phase 2: Fixed all Python linting errors (auto-fixed F401 unused imports, fixed E712 boolean comparisons using .is_(), fixed E741 ambiguous var names, fixed E711 None comparisons, fixed noqa directive syntax)
- 2026-01-23 Phase 2: Fixed E501 line-length issues by breaking long lines
- 2026-01-23 Phase 2: Ran ruff format to standardize code style
- 2026-01-23 Phase 3: Created eslint.config.js for ESLint 9.x flat config with Vue 3 + TypeScript
- 2026-01-23 Phase 3: Fixed 2 ESLint errors (no-this-alias, prefer-const)
- 2026-01-23 Phase 4: All checks pass - ruff check, ruff format, pytest (45 tests), npm run lint (0 errors, 134 warnings)
- 2026-01-23 All success criteria verified, ready for /flywheel-done
- 2026-01-23 Committed and pushed (13936814)
- 2026-01-23 PR created: https://github.com/SophiaSoftwareLLC/Sophia.Roadmap/pull/5
- 2026-01-23 Work item completed
