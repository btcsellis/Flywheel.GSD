# UW Migration 2: Bronze Layer - Simple Sources

## Metadata
- id: uw-migration-2-bronze-simple
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new


## Description

Load simple bronze layer tables from Parquet and CSV sources. These have minimal transformation requirements.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Notebook**: `nb_load_parquet_files`
   | Source | Target Table |
   |--------|--------------|
   | Historical 211 Calls.parquet | bronze.historical_211_calls |
   | Sophia Contact Records Static.parquet | bronze.sophia_contact_records_static |

2. **Notebook**: `nb_load_csv_files`
   | Source | Target Table |
   |--------|--------------|
   | FollowUpResults.csv | bronze.follow_up_results |
   | PublicSiteLogs.csv | bronze.public_site_logs |

3. **Notebook**: `nb_load_extended_fields`
   | Source | Target Table |
   |--------|--------------|
   | Contact Reports Extended Fields.csv | bronze.contact_reports_extended_fields |

### Dependencies
- uw-migration-1-foundation (lakehouse must exist)

### Notes
- Extended Fields uses SAS token - see `tables/Sophia Extended Properties.tmdl:28-35`
- SAS token expires 2028-06-03 - consider alternative access method
- Parquet files need type conversions - see `expressions.tmdl:1-33`

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
