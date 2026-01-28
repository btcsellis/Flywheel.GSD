# Create gold table for CR QA in vialink fabric workspace

## Metadata
- id: create-gold-table-for-cr-qa-in-vialink-f-459
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: review
- workflow: main
- tmux-session: Sophia-Fabric
- assigned-session:

## Description

Create a standalone notebook in the Sophia All Tenants workspace that reads from `silver.cr_qa_results`, filters to VIA LINK tenant (`vialink-prod-0`), and writes to a gold table in the VIA LINK Fabric workspace.

**Approach:**
- Standalone notebook (not using the routing rules infrastructure)
- Filter silver data to `tenant_id = 'vialink-prod-0'`
- Write to VIA LINK workspace lakehouse as `gold_cr_qa_results`
- Gold layer should drop internal audit columns (source_file_path, bronze_version, source_table, silver_version) and keep business-relevant columns
- Follow existing notebook patterns (nb_route_gold_resources_to_tenants for cross-workspace writes)

## Success Criteria

- [x] Notebook `nb_silver_to_gold_cr_qa_results_vialink` created in `pbisync/sophiadata/Notebooks/`
- [x] Reads from `silver.cr_qa_results` table
- [x] Filters to `tenant_id = 'vialink-prod-0'`
- [x] Writes to VIA LINK workspace lakehouse via OneLake abfss:// path as `gold_cr_qa_results`
- [x] Gold schema drops internal columns (source_file_path, bronze_version, source_table, silver_version, source_system)
- [x] Adds gold audit column (gold_processed_timestamp)
- [x] Uses overwrite mode with Delta format
- [x] Includes summary statistics output (record counts)
- [x] Follows existing Fabric notebook format conventions

## Notes

- VIA LINK workspace OneLake path needs to be retrieved from `silver.workspace_metadata` or hardcoded if not available
- This is a one-tenant filter, not multi-tenant routing

## Implementation Plan

### Phase 1: Create Notebook Structure

1. **Create notebook directory and .platform file**
   - Create `pbisync/sophiadata/Notebooks/nb_silver_to_gold_cr_qa_results_vialink.Notebook/`
   - Create `.platform` with type "Notebook" (logicalId will be assigned after Fabric sync)
   - Verification: Directory and .platform file exist

2. **Create notebook-content.py with Fabric notebook structure**
   - Use standard lakehouse metadata (workspace: b34b6028-01e6-4eb4-95dc-d3b0bb71d444, lakehouse: 33db8d18-2176-4eda-a3c9-5631ba59d7a8)
   - Follow existing `nb_silver_to_gold_*` pattern from `nb_silver_to_gold_referrals.Notebook`
   - Verification: File follows Fabric notebook format with proper METADATA blocks

### Phase 2: Implement Notebook Logic

The notebook will have these cells:

3. **Cell 1: Configuration and Setup**
   - Imports (pyspark.sql.functions, datetime)
   - Constants: SOURCE_TABLE, TARGET_TENANT, VIALINK_WORKSPACE_NAME, VIALINK_LAKEHOUSE_NAME
   - Print execution header
   - Verification: Cell defines all required constants

4. **Cell 2: Get VIA LINK OneLake Path**
   - Read from `silver.workspace_metadata` if entry exists
   - Fallback: Hardcode VIA LINK workspace/lakehouse IDs (need user to provide or lookup in Fabric)
   - OneLake path format: `abfss://{workspace_id}@onelake.dfs.fabric.microsoft.com/{lakehouse_id}/Tables`
   - Verification: OneLake path is retrieved/constructed

5. **Cell 3: Read and Filter Silver Data**
   - Read from `silver.cr_qa_results`
   - Filter: `tenant_id = 'vialink-prod-0'`
   - Count and print source/filtered record counts
   - Verification: Filtered dataframe created, counts printed

6. **Cell 4: Transform to Gold Schema**
   - Drop internal columns: source_file_path, bronze_version, source_table, silver_version, source_system
   - Add `gold_processed_timestamp` using `current_timestamp()`
   - Keep all business-relevant columns
   - Verification: Gold dataframe has expected columns

7. **Cell 5: Write to VIA LINK Lakehouse**
   - Use cross-workspace write pattern with flat naming: `{onelake_path}/gold_cr_qa_results`
   - Mode: overwrite, format: delta
   - Options: overwriteSchema=true, delta.autoOptimize.optimizeWrite=true
   - Verification: Write completes without error

8. **Cell 6: Summary Statistics**
   - Print final record count
   - Print column list
   - Print completion timestamp
   - Verification: Summary output shows expected values

### Phase 3: Workspace Metadata (if needed)

9. **Add VIA LINK to workspace_metadata table**
   - If VIA LINK not in `silver.workspace_metadata`, need to add it
   - Requires VIA LINK workspace_id and lakehouse_id (from Fabric UI or .platform files)
   - Alternative: Hardcode in notebook with TODO comment to add to metadata later
   - Verification: OneLake path resolves correctly

### Verification

After implementation:
1. Notebook file structure validates (correct Fabric format)
2. Git push and Fabric sync succeed
3. Notebook runs successfully in Fabric
4. `gold_cr_qa_results` table appears in VIA LINK lakehouse
5. Record count matches expected (vialink-prod-0 tenant records from silver)

### Files to Create/Modify

**Create:**
- `pbisync/sophiadata/Notebooks/nb_silver_to_gold_cr_qa_results_vialink.Notebook/.platform`
- `pbisync/sophiadata/Notebooks/nb_silver_to_gold_cr_qa_results_vialink.Notebook/notebook-content.py`

**Reference (read-only):**
- `pbisync/sophiadata/Notebooks/nb_silver_to_gold_referrals.Notebook/notebook-content.py` - Pattern reference
- `pbisync/sophiadata/nb_route_gold_resources_to_tenants.Notebook/notebook-content.py` - Cross-workspace pattern
- `pbisync/sophiadata/Notebooks/nb_bronze_to_silver_cr_qa_results.Notebook/notebook-content.py` - Source schema reference

### Dependencies

- VIA LINK workspace/lakehouse IDs must be known or discoverable
- User must sync Fabric after notebook creation to get logicalId
- `silver.cr_qa_results` table must exist and have data

## Execution Log

- 2026-01-28T15:30:54.730Z Work item created
- 2026-01-28T15:35:00.000Z Goals defined, success criteria added
- 2026-01-28T15:40:00.000Z Implementation plan created
- 2026-01-28T15:54:00.000Z Created notebook directory and .platform file
- 2026-01-28T15:54:30.000Z Created notebook-content.py with 6 cells (config, path lookup, read/filter, transform, write, summary)
- 2026-01-28T15:55:00.000Z Verified notebook structure (6 CELL, 7 METADATA markers)
- 2026-01-28T15:55:00.000Z All success criteria verified
- 2026-01-28T15:55:00.000Z Ready for /flywheel-done
