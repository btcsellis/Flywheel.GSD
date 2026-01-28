# Standardize lakehouse schemas across all Fabric workspaces

## Metadata
- id: standardize-lakehouse-schemas-847
- project: sophia/Sophia.Fabric
- priority: medium
- created: 2026-01-28
- status: new
- workflow:
- tmux-session:
- assigned-session:

## Description

Enable schemas on all tenant lakehouses and standardize on using `bronze`, `silver`, `gold` as schema names instead of flat table naming or `dbo` default.

**Current state:**
- VIA LINK (lh_vialink_qa): Schema-enabled with `dbo` default
- LAUW (lh_lauw): Non-schema (flat `Tables/{table}`)
- Sophia All Tenants (lh_sophia_data): Uses hierarchical paths (`Tables/gold/`)

**Target state:**
- All lakehouses schema-enabled
- Use `gold` schema for gold tables (not `dbo`)
- Consistent cross-workspace write pattern: `Tables/gold/{table}`
- Update `workspace_metadata` and routing notebooks

## Success Criteria

[To be defined - run /flywheel-define]

## Notes

- Schema-enabled lakehouses align with SQL data warehouse conventions
- Cleaner table references: `gold.cr_qa_results` vs `gold_cr_qa_results`
- Need to check if schemas can be enabled on existing lakehouses or if migration is required
- May need to update existing tables/data
- Reference: `docs/patterns/cross-workspace-gold-table-writes.md`

## Execution Log

- 2026-01-28T21:45:00.000Z Work item created
