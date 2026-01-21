# Implement Password Reset Flow

## Metadata
- id: sophia-pwreset-234
- project: sophia/Sophia.Core
- created: 2025-01-12
- status: done
- assigned-session:

## Description

Users cannot reset their passwords. Implement secure password reset flow with email verification.

## Success Criteria

- [x] Reset request generates secure token
- [x] Token expires after 1 hour
- [x] Email sent with reset link
- [x] Reset page validates token
- [x] Password updated and all sessions invalidated
- [x] Rate limiting on reset requests

## Notes

Using SendGrid for email delivery. Token stored hashed in database.

## Execution Log

- 2025-01-12T10:00:00Z Work item created
- 2025-01-13T09:00:00Z Picked up
- 2025-01-13T12:00:00Z Token generation and email working
- 2025-01-13T15:00:00Z Reset flow complete
- 2025-01-13T16:00:00Z PR merged: github.com/sophia/core/pull/142
