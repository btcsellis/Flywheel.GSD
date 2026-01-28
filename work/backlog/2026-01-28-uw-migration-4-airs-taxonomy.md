# UW Migration 4: Bronze Layer - AIRS Taxonomy XML

## Metadata
- id: uw-migration-4-airs-taxonomy
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new

## Description

Implement the AIRS taxonomy XML parsing notebook. This is high complexity due to the 6-level nested hierarchy that must be flattened.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

### Deliverables

1. **Notebook**: `nb_load_taxonomy_xml`
   | Source | Target Table |
   |--------|--------------|
   | taxonomy.xml | ref.airs_needs_categories |

### Technical Requirements

**Source**: `https://sophiareportingstorage.blob.core.windows.net/schema-files-sc211/taxonomy.xml`

**Power Query Logic to Replicate** (`expressions.tmdl:52-190`):

```
1. Load XML with Xml.Tables()
2. Filter for system = "USA"
3. Expand 6 levels of nested records:
   - Level 1: AIRSNeedsCategories1
   - Level 2: AIRSNeedsCategories2
   - Level 3: AIRSNeedsCategories3
   - Level 4: AIRSNeedsCategories4
   - Level 5: AIRSNeedsCategories5
   - Level 6: AIRSNeedsCategories6
4. Each level expands Term records and Name attributes
5. Combine all 6 levels into single table
6. Exclude specific codes:
   - DT-8700.2500
   - DT-8700.8100
   - PL-2000.1500
```

**Output Columns**:
- Need Code (the AIRS code)
- Need Category 1-6 (hierarchy levels)

### Dependencies
- uw-migration-1-foundation (lakehouse must exist)

### Notes
- XML parsing in PySpark uses different approach than Power Query
- Consider using `spark.read.format("xml")` with appropriate schema
- May need to use recursive UDF or multiple joins to flatten hierarchy

## Success Criteria



## Execution Log
- 2026-01-28 Work item created
