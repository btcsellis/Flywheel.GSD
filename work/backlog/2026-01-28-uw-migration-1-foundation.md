# UW Migration 1: Foundation - Lakehouse and Reference Data

## Metadata
- id: uw-migration-1-foundation
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new
- unattended: true
- assigned-session: 

## Description

Create the `lh_united_way` lakehouse in SC211 (Fabric) workspace and load all reference/dimension tables that other notebooks will depend on.

**Reference**: `sc211/UNITED_WAY_MIGRATION_PLAN.md`

## Success Criteria


## Notes

- RUCA mapping has 30+ value replacements - see `tables/Zip-RUCA.tmdl:48-97`
- USStates lookup is embedded in expressions.tmdl - extract to ref table

## Execution Log

- 2026-01-28 Work item created
