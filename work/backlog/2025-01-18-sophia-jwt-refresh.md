# Implement JWT Refresh Token Rotation

## Metadata
- id: sophia-jwt-127
- project: sophia/Sophia.Core
- created: 2025-01-18
- status: planned
- due: 2026-01-21
- important: true
- assigned-session:

## Description

Current JWT implementation uses long-lived tokens (7 days). Security audit flagged this as a risk. Implement refresh token rotation:

1. Short-lived access tokens (15 min)
2. Refresh tokens that rotate on each use
3. Refresh token family tracking to detect theft

## Success Criteria

- [ ] Access tokens expire after 15 minutes
- [ ] Refresh tokens are single-use and rotate
- [ ] Token family tracking detects reuse attacks
- [ ] Existing sessions gracefully migrate
- [ ] Mobile apps handle token refresh seamlessly

## Notes

This is blocking the security certification. Prioritize over feature work.

Reference implementation: https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation

## Execution Log

- 2025-01-18T10:00:00Z Work item created
- 2025-01-18T10:15:00Z Marked as critical per security team
