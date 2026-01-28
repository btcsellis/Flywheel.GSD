# UW Migration 1: Foundation - Lakehouse and Reference Data

## Metadata
- id: uw-migration-1-foundation
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new

## Description

Create the `lh_united_way` lakehouse in SC211 (Fabric) workspace and load all reference/dimension tables that other notebooks will depend on.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Create lakehouse** `lh_united_way` with folder structure:
   - Tables/bronze/
   - Tables/ref/
   - Tables/silver/

2. **Load reference tables**:
   | Source | Target Table | Complexity |
   |--------|--------------|------------|
   | Internal County Reference.xlsx | ref.county_reference | Low |
   | AIRS Taxonomy Reference (v2).xlsx | ref.airs_codes | Low |
   | RUCA-Zip Code Reference.xlsx | ref.zip_ruca | Medium (RUCA mapping) |
   | USStates (hardcoded in PQ) | ref.us_states | Low |

3. **Notebook**: `nb_load_reference_data`

### Dependencies
- None (this is the foundation)

### Notes
- RUCA mapping has 30+ value replacements - see `tables/Zip-RUCA.tmdl:48-97`
- USStates lookup is embedded in expressions.tmdl - extract to ref table

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
