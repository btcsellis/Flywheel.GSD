# Fix Timezone Display Bug in Activity Feed

## Metadata
- id: bellwether-tz-891
- project: bellwether/BellwetherPlatform
- created: 2025-01-08
- status: done
- assigned-session:

## Description

Activity feed shows timestamps in UTC instead of user's local timezone. Users in Australia reporting confusion about when events occurred.

## Success Criteria

- [x] Timestamps display in user's local timezone
- [x] Timezone detected from browser
- [x] User can override in settings
- [x] Relative times ("2 hours ago") still work correctly

## Notes

Root cause: date-fns format was using UTC. Switched to date-fns-tz.

## Execution Log

- 2025-01-08T14:00:00Z Work item created
- 2025-01-08T15:00:00Z Picked up
- 2025-01-08T16:30:00Z Fix implemented
- 2025-01-08T17:00:00Z PR merged: github.com/bellwether/platform/pull/89
