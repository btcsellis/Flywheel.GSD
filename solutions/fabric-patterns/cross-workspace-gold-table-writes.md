---
date: 2026-01-28
category: fabric-patterns
tags: [fabric, lakehouse, cross-workspace, delta, onelake, schema-enabled]
---

# Cross-Workspace Gold Table Writes in Microsoft Fabric

## Problem

Writing gold tables from one Fabric workspace to another lakehouse requires understanding:
1. OneLake path formats
2. Schema-enabled vs non-schema lakehouses
3. The difference between managed tables and delta file writes

## Solution

### OneLake Path Format

```python
# Base pattern
ONELAKE_PATH = f"abfss://{workspace_id}@onelake.dfs.fabric.microsoft.com/{lakehouse_id}/Tables"
```

### Schema-Enabled Lakehouses (e.g., VIA LINK)

If the target lakehouse has schemas enabled (`defaultSchema: "dbo"`), write to:

```python
target_path = f"{ONELAKE_PATH}/dbo/{table_name}"
```

### Non-Schema Lakehouses (e.g., LAUW)

If the target lakehouse does NOT have schemas enabled, write directly to:

```python
target_path = f"{ONELAKE_PATH}/{table_name}"
```

### How to Check if Lakehouse Has Schemas Enabled

```bash
fab api "workspaces/{workspace_id}/lakehouses/{lakehouse_id}" -X get
```

Look for `"defaultSchema": "dbo"` in the response. If present, schemas are enabled.

### Write Pattern

Cross-workspace writes use `.save(path)` not `.saveAsTable()`:

```python
(df_gold
 .write
 .mode("overwrite")
 .format("delta")
 .option("overwriteSchema", "true")
 .option("delta.autoOptimize.optimizeWrite", "true")
 .option("delta.autoOptimize.autoCompact", "true")
 .save(target_path))
```

The lakehouse auto-registers delta files written to `Tables/` (or `Tables/dbo/`) as managed tables.

### Notebook Configuration

The notebook runs in the SOURCE workspace with SOURCE lakehouse attached:

```python
# META   "dependencies": {
# META     "lakehouse": {
# META       "default_lakehouse": "{source_lakehouse_id}",
# META       "default_lakehouse_name": "{source_lakehouse_name}",
# META       "default_lakehouse_workspace_id": "{source_workspace_id}",
```

But writes to TARGET workspace via OneLake path - no need to attach target lakehouse.

### Getting Workspace/Lakehouse IDs

```bash
# List workspaces
fab api "workspaces" -X get

# List lakehouses in a workspace
fab api "workspaces/{workspace_id}/items?type=Lakehouse" -X get
```

## Prevention

When creating a new cross-workspace gold table notebook:

1. **Check target lakehouse schema status first**
2. **Use the routing infrastructure** (`silver.workspace_metadata` + `silver.routing_rules`) when possible
3. **For one-off notebooks**, hardcode the IDs but document them clearly
4. **Test the write** before assuming the table is created correctly

## Reference

- Working example: `nb_silver_to_gold_cr_qa_results_vialink.Notebook`
- Routing pattern: `nb_route_gold_resources_to_tenants.Notebook`
- Workspace metadata: `nb_seed_workspace_metadata.Notebook`
