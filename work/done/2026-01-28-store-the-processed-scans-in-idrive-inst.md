# Store the processed scans in iCloud instead of Dropbox

## Metadata
- id: store-the-processed-scans-in-idrive-inst-689
- project: personal/paper-yuck
- created: 2026-01-28
- status: done
- unattended: true
- workflow: main
- tmux-session: paper-yuck
- assigned-session:

## Description

Move processed document storage from Dropbox to iCloud Drive. Instead of filing documents to `~/Dropbox/PaperYuck/`, use `~/Library/Mobile Documents/com~apple~CloudDocs/Scans/Processed/`.

Key changes:
- **Destination**: `Scans/Processed/` with category subfolders (Financial, Medical, etc.)
- **NeedsReview**: `Scans/Processed/NeedsReview/` for low-confidence documents
- **Archive**: Remove archiving behavior entirely - processed docs move directly to Processed folder
- **Documentation**: Update CLAUDE.md to reflect new paths

## Success Criteria

- [x] Default `destination_dir` changed to `~/Library/Mobile Documents/com~apple~CloudDocs/Scans/Processed/`
- [x] Default `needs_review_dir` changed to `~/Library/Mobile Documents/com~apple~CloudDocs/Scans/Processed/NeedsReview/`
- [x] Archive functionality removed (no `archive_dir`, no `archive_originals` setting)
- [x] Processed documents are organized into category subfolders under Processed/
- [x] CLAUDE.md updated with new path documentation
- [x] `uv run paper-yuck status` shows the new default paths (verified via Settings instantiation)
- [x] `uv run pytest` passes (8 tests passed)
- [x] No type errors (all imports successful)

## Notes

- This simplifies the workflow: scan → process → file in one location (iCloud)
- Removes Dropbox dependency entirely
- Original files are moved (not copied) to Processed folder, eliminating need for separate archive

## Implementation Plan

### Phase 1: Update Configuration (config.py)

1. **Change default destination_dir**
   - File: `src/paper_yuck/config.py`
   - Change default from `~/Dropbox/PaperYuck` to `~/Library/Mobile Documents/com~apple~CloudDocs/Scans/Processed`

2. **Change default needs_review_dir**
   - File: `src/paper_yuck/config.py`
   - Change default from `~/Dropbox/PaperYuck/NeedsReview` to `~/Library/Mobile Documents/com~apple~CloudDocs/Scans/Processed/NeedsReview`

3. **Remove archive_dir and archive_originals settings**
   - File: `src/paper_yuck/config.py`
   - Remove `archive_dir` field
   - Remove `archive_originals` field
   - Remove archive path expansion from `expand_paths` validator
   - Remove `archive_dir` from `to_yaml` method

### Phase 2: Update Processor (processor.py)

4. **Remove archive functionality from processor**
   - File: `src/paper_yuck/core/processor.py`
   - Remove archive logic from `process_file` method (lines 101-109)
   - Remove `archive_path` from ProcessingResult construction

### Phase 3: Update Models (models.py)

5. **Remove archive_path from ProcessingResult**
   - File: `src/paper_yuck/core/models.py`
   - Remove `archive_path` field from `ProcessingResult` class

### Phase 4: Update CLI (cli.py)

6. **Remove archive display from status command**
   - File: `src/paper_yuck/cli.py`
   - Remove "Archive" row from config table in `status` command

### Phase 5: Update Documentation (CLAUDE.md)

7. **Update paths section**
   - File: `CLAUDE.md`
   - Update Destination path to `~/Library/Mobile Documents/com~apple~CloudDocs/Scans/Processed/`
   - Remove Archive path
   - Update Needs Review path to `~/Library/Mobile Documents/com~apple~CloudDocs/Scans/Processed/NeedsReview/`

8. **Update project description**
   - File: `CLAUDE.md`
   - Change "Stores processed documents in an organized folder structure in Dropbox" to reference iCloud

9. **Update config options section**
   - File: `CLAUDE.md`
   - Remove `archive_dir` option
   - Remove `archive_originals` option reference (not listed but implied)

### Verification

- [ ] Run `uv run pytest` - all tests pass
- [ ] Run `uv run paper-yuck status` - shows new iCloud paths, no archive line
- [ ] Verify no type errors with imports

## Execution Log

- 2026-01-28T16:31:31.065Z Work item created
- 2026-01-28T16:32:00.000Z Goals defined, success criteria added
- 2026-01-28T16:33:00.000Z Implementation plan created
- 2026-01-28T16:34:00.000Z Phase 1: Updated config.py - new default paths, removed archive settings
- 2026-01-28T16:34:30.000Z Phase 2: Updated processor.py - removed archive logic
- 2026-01-28T16:35:00.000Z Phase 3: Updated models.py - removed archive_path field
- 2026-01-28T16:35:30.000Z Phase 4: Updated cli.py - removed archive from status display
- 2026-01-28T16:36:00.000Z Phase 5: Updated CLAUDE.md documentation
- 2026-01-28T16:36:30.000Z Verification: pytest passed (8 tests), all imports successful
- 2026-01-28T16:37:00.000Z All success criteria verified
- 2026-01-28T16:37:00.000Z Ready for /flywheel-done
- 2026-01-28T16:38:00.000Z Committed: 3980bd8
- 2026-01-28T16:38:00.000Z Pushed to main
- 2026-01-28T16:38:00.000Z Work item completed
