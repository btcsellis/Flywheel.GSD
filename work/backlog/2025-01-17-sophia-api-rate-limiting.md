# Add Rate Limiting to Public API

## Metadata
- id: sophia-ratelimit-089
- project: sophia/Sophia.Api
- created: 2025-01-17
- status: goals-set
- due: 2026-01-31
- assigned-session:

## Description

Public API currently has no rate limiting. Add sliding window rate limiting with configurable limits per endpoint and user tier.

Tiers:
- Anonymous: 100 req/hour
- Free: 1000 req/hour
- Pro: 10000 req/hour
- Enterprise: Custom

## Success Criteria

- [ ] Rate limiting middleware implemented
- [ ] Limits configurable per endpoint
- [ ] User tier determines limit
- [ ] Returns 429 with Retry-After header
- [ ] Rate limit headers in all responses (X-RateLimit-*)
- [ ] Redis backend for distributed counting

## Notes

Use sliding window algorithm to prevent burst attacks at window boundaries.

## Execution Log

- 2025-01-17T16:00:00Z Work item created
