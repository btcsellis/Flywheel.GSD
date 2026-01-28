# UW Migration 8: Update Semantic Model

## Metadata
- id: uw-migration-8-semantic-model
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new

## Description

Update the United Way Monthly semantic model to use the new lakehouse tables instead of Azure Blob Storage and API sources.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Update semantic model data sources** to point to lakehouse tables
2. **Validate all reports** work correctly with new data sources
3. **Document any breaking changes** or required report updates

### Technical Requirements

**Tables to Redirect**:

| Current Source | New Source |
|----------------|------------|
| 211 Data expression | silver.call_data |
| Need Data | silver.need_data |
| Survey Data | silver.survey_data |
| Geography | silver.geography |
| Follow Up Results | bronze.follow_up_results |
| Public Site Hits | bronze.public_site_logs |
| Poverty Estimates tables | bronze.poverty_* |
| Census tables | bronze.census_* |
| Texting tables | bronze.*texting* |
| Combined Text Flow Results | bronze.text_flow_results |
| Reference tables | ref.* |

**Approach Options**:
1. **Direct Update**: Modify expressions.tmdl and table partitions to use lakehouse
2. **New Model**: Create fresh semantic model pointing to lakehouse (cleaner)

### Dependencies
- ALL previous migration tasks must be complete
- uw-migration-7-silver-call-data (silver layer must exist)

### Notes
- Model uses Import mode (not Direct Lake) - this won't change
- May need to update calculated columns that reference old column names
- Test refresh performance after migration
- Consider side-by-side validation before cutover

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
