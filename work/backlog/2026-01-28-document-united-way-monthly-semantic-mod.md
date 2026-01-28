# Document United Way Monthly Semantic Model

## Metadata
- id: document-united-way-monthly-semantic-mod-913
- project: sophia/Sophia.Fabric
- created: 2026-01-28
- status: new
- assigned-session:

## Description

The result of this work item will be an MD file that will determine requirements for changing all data sources for the United Way semantic model in the SC211 (Fabric) workspace. The goal is to improve model performance and reliability by moving its source data into fabric and moving the transformation logic from Power Query to notebooks. Currently the data comes from a combination of blob files and api. We should be able to move it to a Fabric lakehouse. I have open to different possible ways to do that (mirroring vs copying).

Note that the model will continue to use import rather than direct lake, and the actual production model will be in a different workspace.

Again, do not do any of the actual work in this work item. Just document the components that we will need, both data sources and notebooks, and include instuctions for where to look to build the details for each component. For example if a notebook serves to replace a set of Power Query logic, note where to find that logic, but don't worry about documenting the exact logic, itself.

## Success Criteria



## Execution Log

- 2026-01-28T13:31:28.883Z Work item created
