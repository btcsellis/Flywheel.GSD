# Add Webhook Delivery Retry Logic

## Metadata
- id: bellwether-webhook-672
- project: bellwether/BellwetherPlatform
- created: 2025-01-15
- status: executing
- due: 2026-01-22
- important: true
- assigned-session: 1737352800-51023

## Description

Webhook deliveries currently fail silently if the endpoint is down. Implement exponential backoff retry with configurable attempts.

Retry schedule: 1min, 5min, 30min, 2hr, 24hr

## Success Criteria

- [x] Failed webhooks queued for retry
- [x] Exponential backoff implemented
- [ ] Webhook delivery status visible in dashboard
- [ ] Manual retry button for failed deliveries
- [ ] Alerting after final retry failure

## Notes

Using Bull queue for job management. Need to add a dedicated webhook-retry queue.

## Execution Log

- 2025-01-15T11:00:00Z Work item created
- 2025-01-18T10:00:00Z Picked up by session
- 2025-01-18T14:00:00Z Retry queue implemented
- 2025-01-18T16:00:00Z Backoff logic working
