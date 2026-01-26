# Handle dynamic configuration

## Metadata
- id: handle-dynamic-configuration-125
- project: personal/flywheel-gsd
- created: 2026-01-26
- status: new
- assigned-session:

## Description

In my root folder, I have .claude-personal, .claude-bellwether, and .claude-sophia. cd'ing into the personal, bellwether, and sophia subfolders does some stuff to set things for that area. We need to do two things. First is to ensure that those settings continue to happen correctly when flywheel starts a new session in one of those areas. Second, we may need to adjust flywheel's permission system to make sure the global permissions are used and are not overwritten.

## Success Criteria



## Execution Log

- 2026-01-26T14:52:49.843Z Work item created
