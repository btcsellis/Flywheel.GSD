# Not getting notifications

## Metadata
- id: not-getting-notifications-790
- project: personal/telegram-integration
- created: 2026-01-27
- status: blocked
- workflow: main
- tmux-session: telegram-integration
- assigned-session:

## Description

Telegram notifications from Claude Code sessions stopped working. Root cause is unknown — could be hooks config overwritten in `~/.claude/settings.json`, daemon not running, telegram credentials issue, or tmux mapping problem. Need to diagnose and restore.

## Success Criteria

- [ ] Root cause identified and documented in this work item
- [ ] `~/.claude/settings.json` has correct hook entries for PreToolUse (AskUserQuestion), PermissionRequest, and Stop events pointing to `~/.claude/hooks/telegram-notify.sh`
- [ ] Telegram daemon is running (`telegram-daemon status` confirms active)
- [ ] `~/.claude/telegram.conf` has valid TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
- [ ] End-to-end test: trigger a notification from a Claude Code session and confirm it arrives in Telegram
- [ ] All existing tests/lint pass

## Implementation Plan

### Phase 1: Diagnose

1. **Test Telegram API connectivity**
   - Run: `source ~/.claude/telegram.conf && curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"` to verify bot token is valid
   - Run: `source ~/.claude/telegram.conf && curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d "chat_id=${TELEGRAM_CHAT_ID}&text=test"` to verify end-to-end delivery
   - If this fails, the token or chat ID is the root cause

2. **Test hook execution manually**
   - Run the hook script with synthetic JSON input piped to stdin from inside a tmux session to verify it executes without error
   - Check exit code and any stderr output
   - This isolates whether the hook script itself is broken vs not being triggered

3. **Verify hooks are being triggered by Claude Code**
   - Check `~/.claude/settings.local.json` hook entries are correctly structured (already confirmed present)
   - Verify that Claude Code loads hooks from `settings.local.json` (not just `settings.json`)
   - If hooks aren't firing at all, the config location or format may have changed in a Claude Code update

4. **Check for duplicate daemon processes**
   - Found two `telegram-daemon _run` processes (PID 12199, 62650). This could cause Telegram API conflicts (both consuming the same updates)
   - Kill duplicates, restart cleanly

### Phase 2: Fix

5. **Apply fix based on diagnosis**
   - If API credentials invalid: update `~/.claude/telegram.conf`
   - If hook not executing: fix script or config
   - If duplicate daemons: stop all, restart single instance
   - If hooks not being triggered: verify config format matches current Claude Code expectations

6. **End-to-end verification**
   - Trigger a real notification from this Claude Code session (e.g., AskUserQuestion)
   - Confirm notification arrives in Telegram
   - Document root cause in this work item

### Verification

- `telegram-daemon status` shows single active process
- Telegram test message received
- Real Claude Code hook triggers notification delivery
- Document root cause in Notes section

## Execution Log

- 2026-01-27T20:26:49.013Z Work item created
- 2026-01-27T20:27:30.000Z Goals defined, success criteria added
- 2026-01-27T20:29:00.000Z Implementation plan created
- 2026-01-27T20:35:00.000Z Diagnosis: API works, hook script works, daemon running. Hooks not firing from Claude Code. Root cause: hooks were moved from settings.json to settings.local.json — settings propagation issue. Blocked pending fix to settings propagation.
