# Implement Cursor-Based Pagination for List Endpoints

## Metadata
- id: bellwether-pagination-318
- project: bellwether/BellwetherPlatform
- created: 2025-01-19
- status: goals-set
- assigned-session:

## Description

The current offset-based pagination breaks when items are added/removed during pagination. Switch to cursor-based pagination for all list endpoints in the API.

Affected endpoints:
- GET /api/projects
- GET /api/tasks
- GET /api/users
- GET /api/activity

## Success Criteria

- [ ] All list endpoints support cursor-based pagination
- [ ] Response includes `nextCursor` and `prevCursor` fields
- [ ] Existing offset params still work (backwards compatibility)
- [ ] Cursor encodes timestamp + id for stable ordering
- [ ] Integration tests updated

## Notes

Reference: https://slack.engineering/evolving-api-pagination-at-slack/

Consider using base64-encoded JSON for cursor to allow future extensibility.

## Execution Log

- 2025-01-19T14:30:00Z Work item created
