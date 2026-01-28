# Standardize lakehouse schemas across all Fabric workspaces

## Metadata
- id: standardize-lakehouse-schemas-847
- project: sophia/Sophia.Fabric
- priority: medium
- created: 2026-01-28
- status: defined
- workflow: main
- tmux-session:
- assigned-session:

## Description

Standardize on `gold` schema for gold tables across all tenant lakehouses.

**Current state:**
- VIA LINK (lh_vialink_qa): Schema-enabled, uses `dbo` → has `dbo.gold_cr_qa_results`
- LAUW (lh_lauw): Non-schema (flat) → has `gold_resources`

**Target state:**
- All tenant lakehouses schema-enabled with `gold` schema
- Consistent cross-workspace write pattern: `Tables/gold/{table}`
- All gold tables in `gold` schema (not `dbo`, not flat)

**Scope:**
- Enable schemas on LAUW
- Create `gold` schema on VIA LINK and LAUW
- Migrate existing tables to `gold` schema
- Update notebooks and metadata

## Success Criteria

### Lakehouse Configuration
- [ ] LAUW lakehouse (lh_lauw) has schemas enabled
- [ ] `gold` schema exists in VIA LINK lakehouse
- [ ] `gold` schema exists in LAUW lakehouse

### Table Migration
- [ ] VIA LINK: `gold.cr_qa_results` exists (migrated from `dbo.gold_cr_qa_results`)
- [ ] LAUW: `gold.resources` exists (migrated from flat `gold_resources`)
- [ ] Old tables/locations cleaned up (`dbo.gold_cr_qa_results`, flat `gold_resources`)

### Notebook Updates
- [ ] `nb_silver_to_gold_cr_qa_results_vialink` writes to `Tables/gold/cr_qa_results`
- [ ] `nb_route_gold_resources_to_tenants` writes to `Tables/gold/{table}` pattern
- [ ] Notebooks run successfully and create tables in correct schema

### Metadata & Documentation
- [ ] `workspace_metadata` OneLake paths updated (if needed)
- [ ] `docs/patterns/cross-workspace-gold-table-writes.md` updated
- [ ] `CLAUDE.md` cross-workspace section updated

## Notes

- Schema-enabled lakehouses align with SQL data warehouse conventions
- Cleaner table references: `gold.cr_qa_results` vs `gold_cr_qa_results`
- Routing notebook benefits from consistent pattern across all targets
- Reference: `docs/patterns/cross-workspace-gold-table-writes.md`
- VIA LINK also has Amazon Connect tables in bronze/silver/gold - those use local writes, not cross-workspace

## Execution Log

- 2026-01-28T21:45:00.000Z Work item created
- 2026-01-28T22:00:00.000Z Goals defined, success criteria added
