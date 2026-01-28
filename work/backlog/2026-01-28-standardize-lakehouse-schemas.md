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
- [ ] New LAUW lakehouse created with schemas enabled (via `fab mkdir -P enableSchemas=true`)
- [ ] Old LAUW lakehouse data migrated and old lakehouse deleted
- [ ] `workspace_metadata` updated with new LAUW lakehouse ID
- [ ] `gold` schema exists in VIA LINK lakehouse (created by writing to `Tables/gold/`)
- [ ] `gold` schema exists in LAUW lakehouse (created by writing to `Tables/gold/`)

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

### Phase 1: Recreate LAUW Lakehouse with Schemas Enabled

**Note:** Cannot enable schemas on existing lakehouses - must recreate. ([Microsoft Fabric Community](https://community.fabric.microsoft.com/t5/Fabric-platform/Can-we-enable-Lakehouse-Schemas-for-an-already-existing/m-p/4787569))

1. **Create new LAUW lakehouse with schemas enabled**
   - Command: `fab mkdir "LAUW (Fabric).Workspace/lh_lauw_v2.Lakehouse" -P enableSchemas=true`
   - Verification: `fab api "workspaces/3ef9a44d-af34-4d7b-84ca-068ed4f74a53/lakehouses/{new_id}"` shows `defaultSchema`

2. **Migrate data from old lh_lauw to lh_lauw_v2**
   - Create migration notebook or use Spark to copy tables
   - Copy existing `gold_resources` (and any other tables) to new lakehouse
   - Verification: Tables appear in new lakehouse

3. **Update workspace_metadata with new lakehouse ID**
   - Update `nb_seed_workspace_metadata.Notebook` with new lakehouse ID
   - Re-run seed notebook to update `silver.workspace_metadata`
   - Verification: `silver.workspace_metadata` has new LAUW lakehouse ID and OneLake path

4. **Delete old lh_lauw lakehouse**
   - Command: `fab rm "LAUW (Fabric).Workspace/lh_lauw.Lakehouse"` (or via UI)
   - Verification: Only lh_lauw_v2 exists

5. **Rename lh_lauw_v2 to lh_lauw** (if supported, otherwise keep v2 name)
   - Via Fabric UI or API
   - Update workspace_metadata if name changes

6. **Verify VIA LINK already schema-enabled**
   - Already confirmed: has `defaultSchema: "dbo"`
   - No action needed for lakehouse itself

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
- `pbisync/sophiadata/nb_seed_workspace_metadata.Notebook/notebook-content.py` - update LAUW lakehouse ID

**Documentation:**
- `docs/patterns/cross-workspace-gold-table-writes.md`
- `CLAUDE.md`

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
