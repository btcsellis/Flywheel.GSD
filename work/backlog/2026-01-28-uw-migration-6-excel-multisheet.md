# UW Migration 6: Bronze Layer - Excel Multi-Sheet Files

## Metadata
- id: uw-migration-6-excel-multisheet
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new

## Description

Load Excel files that have multiple sheets, each becoming a separate table. Medium complexity.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Notebook**: `nb_load_excel_poverty`
   | Source | Sheet | Target Table |
   |--------|-------|--------------|
   | ACS2019_5yr_Poverty-Tables.xlsx | Table2 | bronze.poverty_estimates_race |
   | ACS2019_5yr_Poverty-Tables.xlsx | Poverty Estimates - Education | bronze.poverty_estimates_education |
   | ACS2019_5yr_Poverty-Tables.xlsx | Poverty Estimates - Gender | bronze.poverty_estimates_gender |
   | ACS2019_5yr_Poverty-Tables.xlsx | PopForWhomPovertyMeasured | bronze.pop_for_whom_poverty_measured |

2. **Notebook**: `nb_load_excel_census`
   | Source | Sheet | Target Table |
   |--------|-------|--------------|
   | 2020 Census Population Data.xlsx | Table1 | bronze.census_sc_us_pop_race |
   | 2020 Census Population Data.xlsx | County Pop+Race | bronze.census_county_pop_race |

3. **Notebook**: `nb_load_excel_texting`
   | Source | Sheet | Target Table |
   |--------|-------|--------------|
   | TXT Need Categories.xlsx | Sheet1 | bronze.texting_categories |
   | previousMainMenuResults.xlsx | Runs | bronze.previous_texting_main_menu |
   | Texting Main Menu Data.xlsx | Runs | bronze.updated_texting_main_menu |

### Technical Requirements

**Power Query References**:
- Poverty: `tables/Poverty Estimates - *.tmdl`, `tables/PopForWhomPovertyMeasured.tmdl`
- Census: `tables/SC+US Pop+Race.tmdl`, `tables/County Pop+Race.tmdl`
- Texting: `tables/Texting Categories.tmdl`, `tables/*Texting Main Menu*.tmdl`

**Transformations**:
- Header promotion
- Type conversions
- previousMainMenuResults: Replace "Electric" → "Utility"
- Updated Texting: Sort by Started descending

### Dependencies
- uw-migration-1-foundation (lakehouse must exist)

### Notes
- Use pandas or openpyxl for multi-sheet Excel reading
- Consider helper function for common Excel loading pattern

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
