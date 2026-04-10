---
phase: quick
plan: 260410-jfw
subsystem: tools
tags: [cleanup, dead-code, comment-tools]
dependency_graph:
  requires: []
  provides: [clean-11-tool-server]
  affects: [src/tools/read, src/tools/write, tests/tools]
tech_stack:
  added: []
  patterns: []
key_files:
  deleted:
    - src/tools/write/create-task-comment.ts
    - src/tools/read/list-task-comments.ts
    - tests/tools/create-task-comment.test.ts
    - tests/tools/list-task-comments.test.ts
  modified:
    - src/tools/write/index.ts
    - src/tools/read/index.ts
    - src/tools/read/get-task.ts
    - src/tools/write/create-task.ts
    - src/tools/write/update-task.ts
    - src/tools/write/move-task.ts
    - src/tools/write/complete-task.ts
    - tests/tools/get-task.test.ts
    - tests/tools/complete-task.test.ts
    - tests/tools/move-task.test.ts
    - tests/tools/update-task.test.ts
decisions:
  - "Removed weeek_list_task_comments and weeek_create_task_comment — WEEEK Public API v1 has no comment endpoints; keeping them would cause runtime failures"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-10T11:05:06Z"
  tasks_completed: 2
  files_changed: 11
---

# Quick Task 260410-jfw: Remove Comment Tools Summary

**One-liner:** Deleted non-functional comment tools (weeek_list_task_comments, weeek_create_task_comment) and all comment-stripping dead code — WEEEK API v1 has no comment endpoints.

## Objective

Remove comment-related tools that would always fail at runtime because WEEEK Public API v1 exposes no comment endpoints. Clean up to 11 working tools (7 read + 4 write).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete comment tool files and tests | df709f4 | 4 files deleted |
| 2 | Remove comment references from index files and handlers | e0180c3 | 5 files modified |

## Outcome

- Server now registers exactly 11 tools: 7 read + 4 write
- No comment-related files exist in `src/tools/` or `tests/tools/`
- No comment-stripping code remains in any tool handler
- TypeScript compiles cleanly (`tsc --noEmit` zero errors)
- All 83 tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed comment-stripping dead code from update-task, move-task, complete-task**
- **Found during:** Post-Task 2 verification (`grep -r "comment" src/tools/`)
- **Issue:** `update-task.ts`, `move-task.ts`, and `complete-task.ts` each had the same defensive comment-stripping `if` block. With `list-task-comments` gone, this code is unreachable dead code that the plan's verification grep would catch.
- **Fix:** Removed the 3 stripping blocks and their corresponding test assertions from 6 files.
- **Files modified:** `src/tools/write/update-task.ts`, `src/tools/write/move-task.ts`, `src/tools/write/complete-task.ts`, `tests/tools/update-task.test.ts`, `tests/tools/move-task.test.ts`, `tests/tools/complete-task.test.ts`
- **Commit:** 6a17ea6

## Known Stubs

None.

## Self-Check: PASSED

- src/tools/write/index.ts — exists, registers 4 write tools
- src/tools/read/index.ts — exists, registers 7 read tools
- Commits df709f4, e0180c3, 6a17ea6 all present in git log
- `tsc --noEmit` — clean
- `vitest run` — 83/83 pass
