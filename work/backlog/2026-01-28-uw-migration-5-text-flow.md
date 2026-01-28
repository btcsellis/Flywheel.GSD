# UW Migration 5: Bronze Layer - Text Flow Results

## Metadata
- id: uw-migration-5-text-flow
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new

## Description

Implement the Text Flow Results Excel parsing notebook. This is very high complexity due to 170+ columns and extensive transformation logic.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Notebook**: `nb_load_text_flow`
   | Source | Target Table |
   |--------|--------------|
   | TextFlowResults.xlsx | bronze.text_flow_results |

### Technical Requirements

**Source**: `https://sophiareportingstorage.blob.core.windows.net/data-files-sc211/TextFlowResults.xlsx`
**Sheet**: Runs

**Power Query Logic to Replicate** (`tables/Combined Text Flow Results.tmdl:520-575`):

```
1. Load Excel sheet "Runs" with 170+ columns
2. Type conversions for all columns (datetime, int, text, etc.)
3. Add 12 conditional columns combining old/new service flows:
   - CombinedFoodServDescr
   - CombinedFoodZipValue
   - CombinedFoodCounty
   - CombinedFoodAskedForMoreProv
   - CombinedElectricServDescr
   - CombinedElectricZip
   - CombinedElectricCounty
   - CombinedElectricAskedForMoreProv
   - CombinedRentZip
   - CombinedRentServDescr
   - CombinedRentCounty
   - CombinedRentAskForMoreProv
4. Value replacements for service name normalization:
   - "Rent Assistance" → "Rent"
   - "Rent Payment Assistance" → "Rent"
   - "Electric Assistance" → "Utility"
   - "Food Pantry" → "Food"
   - etc.
5. Remove 200+ redundant columns (old service flows)
6. Convert "Yes"/"No" to boolean for AskedForMoreProviders columns
```

**Service Flows Covered**:
- Benefits Screening, Affordable Housing, Legal Aid
- Utility Assistance, Mental Health, Mortgage Payment Assistance
- Shelters, Food Pantries, Rent Payment Assistance
- Electric Assistance, Rent Assistance, DSS Main Flow

### Dependencies
- uw-migration-1-foundation (lakehouse must exist)

### Notes
- Consider loading raw first, then transforming in separate silver notebook
- Column names have spaces and special characters - need careful handling
- Very wide table - monitor memory usage

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
