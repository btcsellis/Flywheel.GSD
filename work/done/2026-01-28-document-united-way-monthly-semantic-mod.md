# Document United Way Monthly Semantic Model

## Metadata
- id: document-united-way-monthly-semantic-mod-913
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: done
- workflow: worktree
- tmux-session: flywheel-Sophia-Fabric-document-united-way-monthly-semantic-mod-913
- assigned-session:
- pr: https://github.com/SophiaSoftwareLLC/Sophia.Fabric/pull/1

## Description

The result of this work item will be an MD file that will determine requirements for changing all data sources for the United Way semantic model in the SC211 (Fabric) workspace. The goal is to improve model performance and reliability by moving its source data into fabric and moving the transformation logic from Power Query to notebooks. Currently the data comes from a combination of blob files and api. We should be able to move it to a Fabric lakehouse. I have open to different possible ways to do that (mirroring vs copying).

Note that the model will continue to use import rather than direct lake, and the actual production model will be in a different workspace.

Again, do not do any of the actual work in this work item. Just document the components that we will need, both data sources and notebooks, and include instuctions for where to look to build the details for each component. For example if a notebook serves to replace a set of Power Query logic, note where to find that logic, but don't worry about documenting the exact logic, itself.

## Success Criteria

- [x] Data Source Inventory document created with all 16 sources listing:
  - Current location (blob container path or API endpoint)
  - File format (Parquet, CSV, Excel, XML, API)
  - Which semantic model table(s) use this source
  - Target lakehouse table name
  - Migration approach recommendation (shortcut vs notebook)

- [x] Notebook Requirements section for each source needing transformation:
  - Reference to Power Query logic location (TMDL file path + line numbers)
  - Input source and output table names
  - Special handling notes (pagination for API, SAS tokens, multi-sheet Excel parsing)

- [x] Lakehouse Structure section with proposed table organization

- [x] Migration Approach Notes explaining when to use:
  - Shortcuts (static reference data)
  - Copy notebooks (data needing transformation or from API)

## Implementation Plan

### Overview

Create `sc211/UNITED_WAY_MIGRATION_PLAN.md` documenting the migration of all data sources for the United Way Monthly semantic model from Azure Blob Storage + API to a Fabric lakehouse.

### Phase 1: Data Source Inventory

1. **Create the documentation file**
   - File: `sc211/UNITED_WAY_MIGRATION_PLAN.md`
   - Create header and overview section

2. **Document Blob Storage Sources (data-files-sc211)**
   - Source: TMDL files in `sc211/United Way Monthly.SemanticModel/definition/`
   - For each of the 13 files, document:
     - File name and format
     - Blob container path
     - Which table(s) use it (reference expressions.tmdl and tables/*.tmdl)
     - Migration recommendation

   Files to document:
   | File | Format | Reference Location |
   |------|--------|-------------------|
   | Historical 211 Calls.parquet | Parquet | expressions.tmdl:3-15 |
   | Sophia Contact Records Static.parquet | Parquet | expressions.tmdl:22-33 |
   | FollowUpResults.csv | CSV | tables/Follow Up Results.tmdl:140-142 |
   | PublicSiteLogs.csv | CSV | tables/Public Site Hits.tmdl:373-376 |
   | ACS2019_5yr_Poverty-Tables.xlsx | Excel | tables/Poverty Estimates - *.tmdl, PopForWhomPovertyMeasured.tmdl |
   | TXT Need Categories.xlsx | Excel | tables/Texting Categories.tmdl:16-19 |
   | previousMainMenuResults.xlsx | Excel | tables/Previous Texting Main Menu Data.tmdl:103-106 |
   | 2020 Census Population Data.xlsx | Excel | tables/SC+US Pop+Race.tmdl, County Pop+Race.tmdl |
   | Internal County Reference.xlsx | Excel | tables/County Reference.tmdl:173-176 |
   | RUCA-Zip Code Reference.xlsx | Excel | tables/Zip-RUCA.tmdl:52-55 |
   | Texting Main Menu Data.xlsx | Excel | tables/Updated Texting Main Menu Data.tmdl:119-122 |
   | AIRS Taxonomy Reference (v2).xlsx | Excel | tables/AIRS Codes.tmdl:56-59 |
   | TextFlowResults.xlsx | Excel | tables/Combined Text Flow Results.tmdl:524-527 |

3. **Document Additional Blob Source (data-files-sc211-all)**
   - Contact Reports Extended Fields.csv (SAS token access)
   - Reference: tables/Sophia Extended Properties.tmdl:32

4. **Document Schema Source (schema-files-sc211)**
   - taxonomy.xml
   - Reference: expressions.tmdl:52-75

5. **Document API Source**
   - Sophia API endpoint: api.sophia-app.com/v2/GetContactRecords
   - Reference: expressions.tmdl:192-362
   - Note pagination logic, date range parameters, subscription key

### Phase 2: Notebook Requirements

6. **Identify sources needing notebook transformation**
   - API data (requires HTTP calls, pagination)
   - Excel files with multi-sheet parsing
   - Sources with significant Power Query transformations

7. **Document notebook requirements for each**
   - For API: Reference getSophiaApiData function at expressions.tmdl:271-362
   - For Excel multi-sheet: List all sheets and their target tables
   - For complex transformations: Reference the specific Power Query steps

### Phase 3: Lakehouse Structure

8. **Propose lakehouse table organization**
   - Bronze layer: Raw copies of source files
   - Silver layer: Cleaned/parsed data
   - Gold layer: Final tables for semantic model consumption
   - Naming conventions matching existing patterns

### Phase 4: Migration Approach Notes

9. **Document approach recommendations**
   - Shortcuts: For static reference data (RUCA codes, county reference, census data)
   - Copy notebooks: For API data and sources needing transformation
   - Consider mirroring vs copying trade-offs for each source type

### Verification

- [ ] All 16 sources documented with complete details
- [ ] Power Query reference locations are accurate (can navigate to file:line)
- [ ] Notebook requirements clearly specify what transformation logic to replicate
- [ ] Lakehouse structure follows project conventions
- [ ] Migration recommendations provided for each source

## Execution Log

- 2026-01-28T13:31:28.883Z Work item created
- 2026-01-28T14:35:00.000Z Goals defined, success criteria added
- 2026-01-28T14:45:00.000Z Implementation plan created
- 2026-01-28T15:15:00.000Z Created sc211/UNITED_WAY_MIGRATION_PLAN.md with complete documentation
- 2026-01-28T15:15:00.000Z All success criteria verified
- 2026-01-28T15:15:00.000Z Ready for /flywheel-done
- 2026-01-28T15:30:00.000Z Committed and pushed (bb152fb)
- 2026-01-28T15:30:00.000Z PR created: https://github.com/SophiaSoftwareLLC/Sophia.Fabric/pull/1
- 2026-01-28T15:30:00.000Z Work item completed
