# UW Migration 3: Bronze Layer - Sophia API

## Metadata
- id: uw-migration-3-sophia-api
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new

## Description

Implement the Sophia API data ingestion notebook. This is high complexity due to pagination, authentication, and date range handling.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Notebook**: `nb_load_sophia_api`
   | Source | Target Table |
   |--------|--------------|
   | api.sophia-app.com/v2/GetContactRecords | bronze.sophia_api_contact_records |

2. **Key Vault configuration** for subscription key

### Technical Requirements

**API Details**:
- Endpoint: `https://api.sophia-app.com/v2/GetContactRecords`
- Query key: `unitedwaymonthly`
- Format: CSV
- Page size: 1000 records (`$top`)
- Pagination: `$skip` parameter
- Date range: `startTime[gt]` parameter

**Power Query Logic to Replicate** (`expressions.tmdl:271-362`):
```
1. Fetch first page (skip=0)
2. Parse CSV, promote headers
3. Loop: fetch next page (skip += 1000)
4. Skip header row on subsequent pages
5. Stop when page is empty
6. Combine all pages
7. Apply type conversions
```

### Dependencies
- uw-migration-1-foundation (lakehouse must exist)
- uw-migration-2-bronze-simple (for USStates lookup pattern)

### Notes
- Subscription key must NOT be hardcoded - use Key Vault
- Consider incremental refresh strategy for date range parameters
- Current range: 2024-07-01 to 2025-06-30

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
