---
name: weeek-today
description: Use when the user wants a quick view of their tasks for today — "/weeek-today", "what's on my plate", "мои задачи на сегодня", "что в работе". Resolves the user via git config, lists their open assigned tasks, and groups them by project and column.
---

# weeek-today

Use this skill when the user asks for their daily task list from WEEEK. Read-only — never moves or modifies tasks.

## Steps

1. Run `git config user.email` (via Bash). This is how the skill identifies the current user. If empty, ask the user for their WEEEK email.

2. Call `weeek_list_workspace_members`. Find the member whose email matches (case-insensitive). If no match, fall back to: ask the user which member they are, by name.

3. Read `.weeek.json` for `defaultProjectId`. If set, restrict the next call. Otherwise call `weeek_list_projects` and process each active project.

4. For each project: call `weeek_list_tasks({ project_id, assignee_id: <me> })`. Filter client-side to tasks not in any column matching `statusHints.done`. If `statusHints.done` is missing, include all tasks except those whose status indicates "completed/closed" by their flag (the get/list response should expose this — surface what you see).

5. Render the result as a compact markdown list grouped by project, then by column:

   ```
   **<Project A>**
   - In Progress: <id> <title> (due <date>)
   - Review:      <id> <title>
   ```

6. If the list is empty, say so plainly. Do not invent or summarise.

## What this skill does NOT do

- Does not write anything.
- Does not show full descriptions — only titles + due dates. Users can call `weeek-context` for details.
