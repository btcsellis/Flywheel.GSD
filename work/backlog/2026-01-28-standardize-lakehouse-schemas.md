# Standardize lakehouse schemas across all Fabric workspaces

## Metadata
- id: standardize-lakehouse-schemas-847
- project: sophia/Sophia.Fabric
- priority: medium
- created: 2026-01-28
- status: planned
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

## Implementation Plan

### Phase 1: Enable Schemas on LAUW Lakehouse

1. **Enable schemas on LAUW via Fabric UI**
   - Navigate to LAUW workspace → lh_lauw lakehouse → Settings
   - Enable "Schemas" feature (if available)
   - If not available via UI, may need to recreate lakehouse with schemas enabled
   - Verification: `fab api "workspaces/.../lakehouses/..."` shows `defaultSchema`

2. **Verify VIA LINK already schema-enabled**
   - Already confirmed: has `defaultSchema: "dbo"`
   - No action needed

### Phase 2: Update Notebooks for `gold` Schema Path

3. **Update `nb_silver_to_gold_cr_qa_results_vialink`**
   - File: `pbisync/sophiadata/Notebooks/nb_silver_to_gold_cr_qa_results_vialink.Notebook/notebook-content.py`
   - Change: `target_path = f"{ONELAKE_BASE}/Tables/dbo/{TARGET_TABLE_NAME}"`
   - To: `target_path = f"{ONELAKE_BASE}/Tables/gold/{TARGET_TABLE_NAME}"`
   - Also rename `TARGET_TABLE_NAME` from `gold_cr_qa_results` to `cr_qa_results` (schema provides the "gold" prefix)
   - Verification: Run notebook, check table appears as `gold.cr_qa_results`

4. **Update `nb_route_gold_resources_to_tenants`**
   - File: `pbisync/sophiadata/nb_route_gold_resources_to_tenants.Notebook/notebook-content.py`
   - Change: `full_path = f"{onelake_path}/{table_name}"`
   - To: `full_path = f"{onelake_path}/gold/{table_name}"`
   - Verification: Run notebook, check tables appear in `gold` schema

### Phase 3: Migrate Existing Tables

5. **Run updated VIA LINK notebook**
   - Creates `gold.cr_qa_results` in VIA LINK lakehouse
   - Old `dbo.gold_cr_qa_results` can be deleted manually after verification

6. **Run updated routing notebook**
   - Creates `gold.resources` (and other routed tables) in LAUW lakehouse
   - Old flat `gold_resources` can be deleted manually after verification

7. **Clean up old tables/folders** (manual via Fabric UI)
   - VIA LINK: Delete `dbo.gold_cr_qa_results`, delete stray folders from earlier attempts
   - LAUW: Delete flat `gold_resources`

### Phase 4: Update Documentation

8. **Update `docs/patterns/cross-workspace-gold-table-writes.md`**
   - Remove schema-enabled vs non-schema distinction
   - Standardize on `Tables/gold/{table}` pattern for all lakehouses
   - Update examples to show `gold` schema path

9. **Update `CLAUDE.md` cross-workspace section**
   - Simplify to single pattern: `Tables/gold/{table}`
   - Remove conditional logic for schema-enabled vs non-schema

10. **Update notebook content to Fabric**
    - Use `fab api` to update notebook definitions after local edits
    - Sync via GitHub → Fabric

### Files to Modify

**Notebooks:**
- `pbisync/sophiadata/Notebooks/nb_silver_to_gold_cr_qa_results_vialink.Notebook/notebook-content.py`
- `pbisync/sophiadata/nb_route_gold_resources_to_tenants.Notebook/notebook-content.py`

**Documentation:**
- `docs/patterns/cross-workspace-gold-table-writes.md`
- `CLAUDE.md`

**No changes needed:**
- `nb_seed_workspace_metadata.Notebook` - onelake_path still ends with `/Tables` (schema added by notebooks)

### Verification

After all changes:
1. VIA LINK lakehouse shows `gold.cr_qa_results` table
2. LAUW lakehouse shows `gold.resources` table (and other routed tables)
3. No orphan tables in `dbo` schema or flat naming
4. Both notebooks run successfully
5. Documentation reflects unified `Tables/gold/{table}` pattern

### Dependencies

- LAUW must have schemas enabled before routing notebook can write to `gold` schema
- If schemas cannot be enabled on existing LAUW lakehouse, may need to recreate it

## Notes

- Schema-enabled lakehouses align with SQL data warehouse conventions
- Cleaner table references: `gold.cr_qa_results` vs `gold_cr_qa_results`
- Routing notebook benefits from consistent pattern across all targets
- Reference: `docs/patterns/cross-workspace-gold-table-writes.md`
- VIA LINK also has Amazon Connect tables in bronze/silver/gold - those use local writes, not cross-workspace
- Writing to `Tables/gold/{table}` auto-creates the `gold` schema folder

## Execution Log

- 2026-01-28T21:45:00.000Z Work item created
- 2026-01-28T22:00:00.000Z Goals defined, success criteria added
- 2026-01-28T22:15:00.000Z Implementation plan created
