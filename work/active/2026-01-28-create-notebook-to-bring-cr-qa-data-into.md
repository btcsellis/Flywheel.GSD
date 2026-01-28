# Create notebook to bring CR QA data into Lakehouse

## Metadata
- id: create-notebook-to-bring-cr-qa-data-into-896
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: planned
- workflow: main
- tmux-session: Sophia-Fabric
- assigned-session:

## Description

Create a bronze ingestion notebook that copies CR QA result data from Azure Blob Storage (`sophiaprode1d873af7fc4.blob.core.windows.net/cr-qa-results`) into the existing `lh_sophia_data` Lakehouse in the `Sophia All Tenants` workspace.

**Data structure**: Container has tenant folders (currently only `vialink-prod-0`), each containing CR folders, each containing JSON files.

**Approach**: Copy via notebook (not shortcut/mirror), following the existing bronze medallion pattern with audit columns. Write as Delta tables to `Tables/bronze/cr_qa_*`. Support incremental/repeated runs. Workspace identity already has access to the blob container.

**Scope**: Bronze layer only. Silver/gold layers are future work.

## Success Criteria

- [ ] Notebook `nb_bronze_cr_qa_results` exists and follows existing bronze patterns (audit columns, Delta write)
- [ ] Reads JSON files from `cr-qa-results` blob container, traversing tenant/CR folder hierarchy
- [ ] Writes to `Tables/bronze/cr_qa_results` in `lh_sophia_data` as Delta table
- [ ] Supports incremental runs — does not re-process files already ingested
- [ ] Handles the multi-tenant folder structure (tenant → CR → JSON files)
- [ ] Deployed to Fabric via fabric-cli
- [ ] No type errors or notebook execution failures

## Implementation Plan

### Phase 1: Create Notebook Structure

1. **Create notebook directory and .platform file**
   - Create `pbisync/sophiadata/Notebooks/nb_bronze_cr_qa_results.Notebook/`
   - Create `.platform` file with proper Fabric metadata
   - Files: `nb_bronze_cr_qa_results.Notebook/.platform`
   - Verification: Directory exists with valid .platform JSON

2. **Create notebook-content.py with metadata header**
   - Add Fabric notebook header with lakehouse dependency (`lh_sophia_data`)
   - Configure kernel as `synapse_pyspark`
   - Files: `nb_bronze_cr_qa_results.Notebook/notebook-content.py`
   - Verification: File has proper `# META` sections

### Phase 2: Implement Bronze Ingestion Logic

3. **Add cell 1: Configuration and imports**
   - Import pyspark functions, datetime, logging
   - Define blob storage path: `abfss://cr-qa-results@sophiaprode1d873af7fc4.blob.core.windows.net/`
   - Define target table path: `Tables/bronze/cr_qa_results`
   - Verification: Constants defined, imports complete

4. **Add cell 2: Read JSON files recursively from blob storage**
   - Use `spark.read.json()` with `recursiveFileLookup=true`
   - Add `input_file_name()` to capture source file path
   - Extract tenant_id and contact_record_id from file path using regex
   - Pattern: `{tenant}/{cr_id}/*.json`
   - Verification: DataFrame loads without errors

5. **Add cell 3: Add bronze audit columns**
   - Add `bronze_processed_timestamp` (current_timestamp)
   - Add `source_system` (blob path)
   - Add `bronze_version` (1.0)
   - Add `partition_date` derived from file timestamp or current date
   - Add `source_file_path` for incremental tracking
   - Verification: Columns appear in schema

6. **Add cell 4: Implement incremental merge**
   - Check if target Delta table exists
   - If exists: use MERGE on `source_file_path` to skip already-processed files
   - If not exists: create table with initial write
   - Enable auto-optimize options
   - Verification: Table written successfully

7. **Add cell 5: Summary statistics**
   - Count records by tenant
   - Count records by partition_date
   - Show sample rows
   - Verification: Statistics display

### Phase 3: Deploy to Fabric

8. **Create notebook in Fabric via fabric-cli**
   - Run `fab mkdir "Sophia All Tenants.Workspace/nb_bronze_cr_qa_results.Notebook"`
   - Verification: `fab ls` shows the notebook

9. **Sync GitHub → Fabric**
   - Commit notebook files to git (if using git sync)
   - Or: use `fab cp` to upload notebook content directly
   - Verification: Notebook visible in Fabric workspace

10. **Test execution**
    - Run `fab job run "Sophia All Tenants.Workspace/nb_bronze_cr_qa_results.Notebook"`
    - Check status with `fab job run-status`
    - Verification: Job completes without errors, `bronze.cr_qa_results` table exists

### Verification Commands

```bash
# Create notebook in Fabric
fab mkdir "Sophia All Tenants.Workspace/nb_bronze_cr_qa_results.Notebook"

# Run notebook
fab job run "Sophia All Tenants.Workspace/nb_bronze_cr_qa_results.Notebook"

# Check job status
fab job run-status "Sophia All Tenants.Workspace/nb_bronze_cr_qa_results.Notebook"
```

### Files to Create

- `pbisync/sophiadata/Notebooks/nb_bronze_cr_qa_results.Notebook/.platform`
- `pbisync/sophiadata/Notebooks/nb_bronze_cr_qa_results.Notebook/notebook-content.py`

## Execution Log

- 2026-01-28T13:39:16.100Z Work item created
- 2026-01-28T13:45:00.000Z Goals defined, success criteria added
- 2026-01-28T13:52:00.000Z Implementation plan created
- 2026-01-28T14:14:00.000Z Created notebook directory and .platform file
- 2026-01-28T14:14:30.000Z Created notebook-content.py with bronze ingestion logic
- 2026-01-28T14:16:00.000Z Created notebook in Fabric: fab mkdir succeeded
- 2026-01-28T14:17:00.000Z Imported notebook to Fabric: fab import --format .py succeeded
- 2026-01-28T14:18:00.000Z First test run failed: abfss:// protocol requires HNS-enabled storage
- 2026-01-28T14:19:00.000Z Switched to wasbs://, second test run failed: no credentials
- 2026-01-28T14:22:00.000Z Updated notebook to use Lakehouse shortcut pattern (Files/cr-qa-results)
- 2026-01-28T14:22:00.000Z BLOCKED: Need to create shortcut in lh_sophia_data Lakehouse
