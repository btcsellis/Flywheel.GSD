# Make cnc project work in flywheel

## Metadata
- id: make-cnc-project-work-in-flywheel-335
- project: personal/cnc
- created: 2026-01-23
- status: review
- workflow: main
- tmux-session: cnc
- assigned-session:

## Description

I starting building this project outside of flywheel-gsd, and now I would like to start using flywheel-gsd to improve it. let's just get it going in a tmux session and make sure it launches and works. then I'll start adding features and testing.

## Success Criteria

- [x] Virtual environment is activated and dependencies are installed
- [x] `python -m src.main` launches without errors
- [x] User confirms GUI window opens successfully

## Notes

- User will manually verify GUI functionality
- User has a DXF file for testing
- Already running in tmux session `cnc`
- May need to resolve environment/path issues for the new terminal context

## Implementation Plan

### Phase 1: Environment Setup

1. **Activate virtual environment**
   - Run `source .venv/bin/activate`
   - Verification: `which python` shows `.venv/bin/python`

2. **Verify dependencies installed**
   - Run `pip list` to confirm packages (numpy, numpy-stl, shapely, matplotlib, ezdxf)
   - If missing, run `pip install -e ".[dev]"`
   - Verification: All required packages listed

### Phase 2: Launch Application

3. **Start the application**
   - Run `python -m src.main`
   - Verification: No Python errors/exceptions on startup

4. **User verification**
   - User confirms GUI window appears
   - Verification: User says "done" or confirms success

### Verification Commands

```bash
source .venv/bin/activate
which python  # Should show .venv/bin/python
pip list | grep -E "(numpy|shapely|matplotlib|ezdxf)"
python -m src.main
```

## Execution Log

- 2026-01-23T21:09:16.246Z Work item created
- 2026-01-23 Goals defined: activate venv, install deps, launch app, user verifies GUI
- 2026-01-23 Implementation plan created
- 2026-01-23 21:15 Phase 1 complete: venv activated, all deps verified (numpy 2.4.1, matplotlib 3.10.8, shapely 2.1.2, ezdxf 1.4.3)
- 2026-01-23 21:16 Phase 2 complete: app launched without errors, user confirmed GUI opened
- 2026-01-23 21:16 All success criteria verified, ready for /flywheel-done
