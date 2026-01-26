# Create SC211 (Fabric) Workspace

## Metadata
- id: create-sc211-fabric-workspace-585
- project: sophia/Sophia.Fabric
- created: 2026-01-26
- status: planned
- workflow: main
- tmux-session: Sophia-Fabric
- assigned-session:

## Description

Create a new Fabric workspace called "SC211 (Fabric)" to complement the existing SC211.Workspace (which is a Pro workspace). The new workspace will use the `sophiafabric0.Capacity` Fabric capacity. Optionally copy the United Way Monthly semantic model to the new workspace.

## Success Criteria

- [ ] Workspace "SC211 (Fabric)" exists and is listed via `fab ls`
- [ ] Workspace is assigned to `sophiafabric0.Capacity`
- [ ] United Way Monthly semantic model is copied to the new workspace

## Implementation Plan

### Phase 1: Create Workspace

1. **Create the workspace with capacity assignment**
   - Command: `fab mkdir "SC211 (Fabric).Workspace" -P capacityName=sophiafabric0`
   - This creates the workspace and assigns it to the Fabric capacity in one step
   - Verification: Command completes without error

2. **Verify workspace exists**
   - Command: `fab ls | grep "SC211 (Fabric)"`
   - Verification: Output shows `SC211 (Fabric).Workspace`

### Phase 2: Copy Semantic Model

3. **Copy United Way Monthly semantic model**
   - Command: `fab cp "SC211.Workspace/United Way Monthly.SemanticModel" "SC211 (Fabric).Workspace/United Way Monthly.SemanticModel" -f`
   - Verification: Command completes without error

4. **Verify semantic model exists**
   - Command: `fab ls "SC211 (Fabric).Workspace" | grep "United Way Monthly"`
   - Verification: Output shows `United Way Monthly.SemanticModel`

### Verification Commands

```bash
# Check workspace exists
fab ls | grep "SC211 (Fabric)"

# Check workspace contents
fab ls "SC211 (Fabric).Workspace"

# Open in browser to verify
fab open "SC211 (Fabric).Workspace"
```

## Execution Log

- 2026-01-26T21:55:49.661Z Work item created
- 2026-01-26T21:57:00.000Z Goals defined, success criteria added
- 2026-01-26T21:58:00.000Z Implementation plan created
