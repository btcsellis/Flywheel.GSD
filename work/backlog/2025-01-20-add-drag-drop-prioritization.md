# Add Drag-and-Drop Prioritization to Backlog

## Metadata
- id: flywheel-drag-042
- project: personal/flywheel-gsd
- created: 2025-01-20
- status: created
- assigned-session: 

## Description

The backlog page currently sorts by priority automatically, but users should be able to manually reorder items within the same priority level. Add drag-and-drop functionality to the backlog list.

## Success Criteria

- [ ] Items can be dragged and reordered within the backlog
- [ ] Order persists (stored in a separate ordering file or item metadata)
- [ ] Works on mobile (touch drag)
- [ ] Visual feedback during drag operation

## Notes

Consider using @dnd-kit/core for React drag-and-drop. Keep it simple - don't need nested groups or complex interactions.

## Execution Log

- 2025-01-20T09:00:00Z Work item created
