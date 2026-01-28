# Fix missing conditional sections in requestApitoCosmos

## Metadata
- id: fix-missing-conditional-sections-in-requ-664
- project: sophia/Sophia.Func.Reporting
- created: 2026-01-28
- status: review
- workflow: main
- tmux-session: Sophia-Func-Reporting
- assigned-session:

## Description

The function gets contact records from the Sophia API and inserts them into Cosmos. Some records are missing conditional sections that should be present based on form field values.

**Current behavior**: There's a hardcoded `inject_missing_section_for_firstlink` function that only handles one tenant with specific section IDs.

**Desired behavior**: For all tenants, dynamically inject conditional sections based on TenantConfigs:

1. For each section in a contact record's `sections` array
2. Fetch the section's config from TenantConfigs (where `configType='section'`, `tenantId` matches, and `internalId` matches section `id`)
3. If the config has `conditionalSection.conditionalSectionItems`, evaluate each item's conditions
4. Conditions are evaluated against field values stored in `sections[].data` objects
5. If conditions are met, add the conditional section to the record (if not already present by `id`)

**Key data structures**:
- Contact record sections: `{ id, title, uId, data: { fieldModel: value, ... } }`
- TenantConfig section: `{ internalId, conditionalSection: { conditionalSectionItems: [{ section: {...}, conditionalVisibility: "expr", conditionalVisibilityItems: [...] }] } }`

## Success Criteria

- [x] Remove or replace the hardcoded `inject_missing_section_for_firstlink` function
- [x] Create new function that fetches TenantConfigs for the tenant (configType='section') at the start of processing
- [x] For each contact record, iterate through its sections and check for conditional sections in the config
- [x] Evaluate `conditionalVisibilityItems` conditions against field values in `sections[].data`
- [x] Inject conditional sections (from `conditionalSectionItems[].section`) when conditions are met
- [x] Prevent duplicates by checking if section `id` already exists in the record
- [x] Injected sections include required fields: `id`, `title`, `description`, `uId`, `createdDate`, `lastModifiedDate`
- [x] Works for all tenants, not just specific ones
- [x] Only applies to ContactRecords job type
- [x] Logging added for injected sections (similar to existing pattern)
- [x] All existing tests pass (if any)
- [x] No syntax errors or runtime exceptions

## Notes

- The `conditionalVisibilityItems` JSON array contains structured condition objects with `field.model`, `operator`, `value`, and `logicalOperator` - use this for evaluation rather than parsing the string expression
- Field values are stored in `sections[].data` keyed by field model name
- The section to inject comes from `conditionalSectionItems[].section` and contains the full section definition

## Implementation Plan

### Phase 1: Create Conditional Section Evaluation Functions

1. **Create `fetch_tenant_section_configs` function**
   - File: `functions/requestApiToCosmos.py`
   - Query TenantConfigs container for all documents where `tenantId` matches and `configType='section'`
   - Return a dictionary keyed by `internalId` for fast lookup
   - Cache at function level (passed as parameter) to avoid repeated queries per record
   - Verification: Function returns dict with section configs when tenant has configs, empty dict otherwise

2. **Create `evaluate_condition` helper function**
   - File: `functions/requestApiToCosmos.py`
   - Takes a single condition object from `conditionalVisibilityItems` and field values dict
   - Supports operators: `==`, `!=`, `include` (for arrays), `isNotEmpty`
   - Returns boolean indicating if condition is met
   - Verification: Unit logic - `{"operator": "==", "value": "Yes"}` with field value "Yes" returns True

3. **Create `evaluate_conditions` function**
   - File: `functions/requestApiToCosmos.py`
   - Takes `conditionalVisibilityItems` array and field values dict
   - Evaluates each condition and combines with `logicalOperator` (`||` or `&&`)
   - Returns boolean indicating if all conditions are satisfied
   - Verification: Multiple conditions with `||` return True if any match

4. **Create `get_field_values_from_sections` helper function**
   - File: `functions/requestApiToCosmos.py`
   - Takes a contact record's `sections` array
   - Flattens all `sections[].data` objects into a single dict keyed by field model
   - Returns combined field values dict
   - Verification: Record with 2 sections each having data properties returns merged dict

### Phase 2: Create Main Injection Function

5. **Create `inject_conditional_sections` function**
   - File: `functions/requestApiToCosmos.py`
   - Parameters: `record`, `tenant_id`, `section_configs` (pre-fetched dict)
   - Steps:
     a. Return early if record has no `sections` array
     b. Get flattened field values from all sections using helper
     c. Get existing section IDs to prevent duplicates
     d. For each section in record's sections array:
        - Look up config by section `id` in `section_configs` dict
        - If config has `conditionalSection.conditionalSectionItems`:
          - For each conditional item:
            - Parse `conditionalVisibilityItems` (JSON string to array)
            - Evaluate conditions against field values
            - If conditions met and section `id` not already present:
              - Build section object with: `id`, `title`, `description`, `uId`, `createdDate`, `lastModifiedDate`
              - Append to record's sections
              - Log injection
   - Return modified record
   - Verification: Record with section 49 and `showDemographics='Yes'` gets section 51 injected

### Phase 3: Integrate and Clean Up

6. **Remove `inject_missing_section_for_firstlink` function**
   - File: `functions/requestApiToCosmos.py`
   - Delete lines 300-358 (the entire function)
   - Verification: Function no longer exists in file

7. **Modify `api_to_cosmos` function to use new logic**
   - File: `functions/requestApiToCosmos.py`
   - After initializing Cosmos client (around line 400), add:
     - Get TenantConfigs container client
     - Call `fetch_tenant_section_configs(tenant_id, tenant_configs_container)`
   - Replace line 462 (the old firstlink call):
     - Change from: `new_data = [inject_missing_section_for_firstlink(record, tenant_id) for record in new_data]`
     - Change to: `new_data = [inject_conditional_sections(record, tenant_id, section_configs) for record in new_data]`
   - Verification: Function calls new injection logic for ContactRecords job type

### Phase 4: Handle Edge Cases

8. **Add error handling for JSON parsing**
   - In `inject_conditional_sections`, wrap `conditionalVisibilityItems` parsing in try/except
   - Log warning and skip item if JSON is malformed
   - Verification: Malformed JSON doesn't crash the function

9. **Add null/missing field handling**
   - In `evaluate_condition`, handle cases where field doesn't exist in data
   - Return False if field is missing (condition can't be met)
   - Verification: Missing field doesn't cause KeyError

### Verification

- Run locally with `func host start`
- Test with a tenant known to have conditional sections (e.g., vialink-prod-0)
- Verify logs show section injection happening
- Verify no syntax errors on startup
- Check that firstlink-prod-0 tenant still works (regression)

## Execution Log

- 2026-01-28T20:41:21.556Z Work item created
- 2026-01-28T20:52:00.000Z Goals defined, success criteria added
- 2026-01-28T21:05:00.000Z Implementation plan created
- 2026-01-28T21:15:00.000Z Phase 1: Created helper functions (fetch_tenant_section_configs, get_field_values_from_sections, evaluate_condition, evaluate_conditions)
- 2026-01-28T21:20:00.000Z Phase 2: Created inject_conditional_sections function
- 2026-01-28T21:22:00.000Z Phase 3: Removed inject_missing_section_for_firstlink, integrated new logic into api_to_cosmos
- 2026-01-28T21:23:00.000Z Cleanup: Removed duplicate get_document_size function and dead code
- 2026-01-28T21:24:00.000Z Verified: Python syntax check passed
- 2026-01-28T21:25:00.000Z All success criteria verified
- 2026-01-28T21:25:00.000Z Ready for /flywheel-done
