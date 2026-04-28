---
name: weeek-advance
description: Use when the user wants to move a WEEEK task to its next workflow stage — "/weeek-advance", "переведи в Review", "продвинь задачу", "ready for QA". Supports any column structure (In Progress → Review → Testing → Done or simpler) and never skips stages without confirmation.
---

# weeek-advance

Use this skill when the user wants to progress a task forward in its board's workflow. Designed for any column structure — never assumes a specific layout.

## Steps

1. Determine the task ID. Try in order:
   - User passed it explicitly.
   - Apply detector patterns to current branch name (`git symbolic-ref --short HEAD`). Patterns: see weeek-standup for the same list.
   - Ask the user.

2. Call `weeek_get_task({ task_id })`. Note the task's current `boardId` and current column.

3. Call `weeek_list_board_columns({ board_id })`. The response is an ordered list — preserve that order. Find the index of the task's current column.

4. Build the advance menu. Include:
   - **Next column** — the column at `current_index + 1` if it exists.
   - **Named candidates** — if `.weeek.json` has `statusHints.review`, find any column matching it (case-insensitive substring) and add as "Review". Same for `testing` and `done`. Skip stages whose columns can't be matched.

5. Present the menu to the user. Example:
   ```
   Current column: In Progress (index 1 of 4)
   Advance to:
     1. Code Review (next column)
     2. Testing
     3. Done
   ```
   Wait for user choice. Never auto-pick.

6. Execute the chosen move:
   - If the destination matches `statusHints.done` → call `weeek_complete_task({ task_id })`.
   - Otherwise → call `weeek_move_task({ task_id, board_column_id: <chosen> })`.

## What this skill does NOT do

- Does not skip stages without explicit user confirmation. If the menu offers Review and Testing and Done, the user picks one — the skill does not jump straight to Done.
- Does not invent column names. If `statusHints` are missing or don't match, the skill falls back to "next column by board order" and asks the user.
