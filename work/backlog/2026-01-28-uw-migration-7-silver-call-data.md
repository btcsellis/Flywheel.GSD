# UW Migration 7: Silver Layer - Call Data Transformation

## Metadata
- id: uw-migration-7-silver-call-data
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new

## Description

Transform and merge call data from multiple bronze sources into the silver layer. This is the core data pipeline that feeds the semantic model.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Notebook**: `nb_transform_call_data`

   **Inputs**:
   - bronze.historical_211_calls
   - bronze.sophia_contact_records_static
   - bronze.sophia_api_contact_records
   - ref.airs_needs_categories
   - ref.us_states

   **Outputs**:
   | Target Table | Description |
   |--------------|-------------|
   | silver.call_data | Merged call records from all sources |
   | silver.need_data | Need codes extracted from calls |
   | silver.survey_data | Survey responses |
   | silver.geography | Location data |

### Technical Requirements

**Power Query Logic to Replicate** (`expressions.tmdl:1-250`):

```
1. Load Historical 211 Calls (parquet)
2. Load Sophia Static (parquet) - add State lookup
3. Load Sophia API Refresh (from bronze) - add State lookup
4. Append all three sources into "211 Data"
5. Join with AIRSNeedsCategories on Need Code
6. Split into dimension tables:
   - Call Data: core call fields
   - Need Data: need codes and categories
   - Survey Data: survey response fields
   - Geography: location fields
```

**Key Transformations**:
- State initials → full name via ref.us_states
- Need Code → Category hierarchy via ref.airs_needs_categories
- Deduplication where needed
- Type standardization across sources

### Dependencies
- uw-migration-1-foundation (reference tables)
- uw-migration-2-bronze-simple (parquet/CSV sources)
- uw-migration-3-sophia-api (API data)
- uw-migration-4-airs-taxonomy (AIRS categories)

### Notes
- This is the critical path - must wait for all bronze sources
- Consider adding data quality checks
- May need to handle schema differences between sources

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
