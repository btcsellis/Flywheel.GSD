# Process scans automatically

## Metadata
- id: process-scans-automatically-585
- project: personal/paper-yuck
- created: 2026-01-28
- status: planned
- workflow: main
- tmux-session: paper-yuck
- assigned-session:

## Description

Let's make it so that scans are processed automatically, either via a trigger when a scan lands or on some sort of recurring schedule, ideally as a background process.

**Approach:**
- File watcher (watchdog) for immediate processing when PDFs land
- Periodic sweep as fallback to catch anything missed (e.g., if watcher was down)
- macOS launchd service (LaunchAgent) to manage the background process
- No notifications needed - just log output

## Success Criteria

- [ ] `paper-yuck watch` command starts a long-running process that monitors the source folder
- [ ] New PDFs are detected and processed within seconds of landing in the source folder
- [ ] Periodic sweep runs on a configurable interval (default: every 5 minutes) to catch missed files
- [ ] Graceful shutdown on SIGTERM/SIGINT (no partial processing)
- [ ] LaunchAgent plist file provided for auto-start on login
- [ ] `paper-yuck service install` command installs the LaunchAgent
- [ ] `paper-yuck service uninstall` command removes the LaunchAgent
- [ ] `paper-yuck service status` command shows if service is running
- [ ] Watch process logs activity to stdout/stderr (viewable via `log show` or redirected by launchd)
- [ ] All existing tests pass
- [ ] No type errors

## Implementation Plan

### Phase 1: File Watcher Core

1. **Create watcher module** (`src/paper_yuck/watcher/watcher.py`)
   - Implement `FileWatcher` class using `watchdog.observers.Observer`
   - `FileSystemEventHandler` subclass to detect new `.pdf` files in source folder
   - Small delay (2-3 seconds) after file creation before processing to ensure file is fully written
   - Track processed files to avoid duplicate processing within session

2. **Create watch service** (`src/paper_yuck/watcher/service.py`)
   - `WatchService` class that combines:
     - File watcher for immediate detection
     - Periodic sweep timer (using `threading.Timer` or `sched`)
   - Signal handling for graceful shutdown (SIGTERM, SIGINT)
   - Processing lock to prevent concurrent processing of same file
   - Logging to stdout/stderr

3. **Add config for sweep interval**
   - Update `config.py` to add `sweep_interval` setting (default: 300 seconds / 5 minutes)
   - Keep existing `watch_interval` for debounce delay

### Phase 2: CLI Commands

4. **Add `watch` command** (`cli.py`)
   - `paper-yuck watch` - starts the long-running watcher
   - Uses `WatchService` from Phase 1
   - Logs startup info (source folder, intervals)
   - Blocks until signal received

5. **Add `service` command group** (`cli.py`)
   - `paper-yuck service install` - copies LaunchAgent plist to `~/Library/LaunchAgents/`
   - `paper-yuck service uninstall` - removes plist and unloads service
   - `paper-yuck service status` - checks if service is loaded/running via `launchctl`

### Phase 3: LaunchAgent

6. **Create LaunchAgent plist template** (`src/paper_yuck/resources/com.paperyuck.agent.plist`)
   - Standard launchd plist structure
   - `RunAtLoad: true` for auto-start
   - `KeepAlive: true` for restart on crash
   - Logs to `~/Library/Logs/paper-yuck/`
   - `ProgramArguments` pointing to `paper-yuck watch`

7. **Plist installation logic** (`src/paper_yuck/service.py`)
   - Determine correct `paper-yuck` executable path (from `sys.executable` parent)
   - Template substitution for paths
   - Create log directory if needed
   - Use `launchctl load/unload` commands

### Phase 4: Testing & Verification

8. **Add watcher tests** (`tests/test_watcher.py`)
   - Test `FileWatcher` detects new files
   - Test debounce behavior
   - Test graceful shutdown
   - Test sweep timer triggers

### Verification

```bash
# Run tests
uv run pytest

# Type check (if mypy configured)
uv run mypy src/paper_yuck

# Manual verification
uv run paper-yuck watch  # Should start and log, Ctrl-C to stop
uv run paper-yuck service status  # Should show "not installed"
uv run paper-yuck service install  # Should install LaunchAgent
uv run paper-yuck service status  # Should show "running"
uv run paper-yuck service uninstall  # Should remove and stop
```

### Files to Create
- `src/paper_yuck/watcher/watcher.py` - FileWatcher class
- `src/paper_yuck/watcher/service.py` - WatchService class
- `src/paper_yuck/service.py` - LaunchAgent management
- `src/paper_yuck/resources/com.paperyuck.agent.plist` - LaunchAgent template
- `tests/test_watcher.py` - Watcher tests

### Files to Modify
- `src/paper_yuck/config.py` - Add `sweep_interval` setting
- `src/paper_yuck/cli.py` - Add `watch` and `service` commands
- `src/paper_yuck/watcher/__init__.py` - Export watcher classes

## Execution Log

- 2026-01-28T22:35:00.108Z Work item created
- 2026-01-28T22:36:00Z Goals defined: watchdog + periodic sweep, launchd service, service management CLI
- 2026-01-28T22:38:00Z Implementation plan created (4 phases: watcher core, CLI, LaunchAgent, testing)
