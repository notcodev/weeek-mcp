---
name: weeek-standup
description: Use when the user wants a daily standup summary — "/weeek-standup", "что я делал вчера", "make my standup". Cross-references recent commits with WEEEK tasks and produces a Yesterday / Today / Blockers markdown block.
---

# weeek-standup

Use this skill when the user wants a quick standup summary. Combines git log with WEEEK task state. Read-only.

## Steps

1. Determine the standup window. Default: yesterday + today. If the user says "this week", expand to the last 7 days.

2. Run `git log --author="$(git config user.email)" --since="yesterday" --pretty=%H%x09%s` (via Bash). This yields `<sha>\t<subject>` per commit.

3. For each subject, extract task IDs by applying these regex patterns in order (the first match's capture group 1 is the ID):

   ```
   /\bWEEEK[-_/](\d+)\b/i
   /\btask[-_/](\d+)\b/i
   /^(\d{2,})[-_/]/
   /#(\d+)\b/
   ```

   If `.weeek.json` defines `taskIdPatterns`, use those instead (they replace the defaults — do not mix).

4. De-duplicate task IDs. For each unique ID: call `weeek_get_task({ task_id })`. Categorise:
   - **Done** — column name matches `statusHints.done` (case-insensitive substring).
   - **In Progress / Review / Testing** — anything else that has commits.

5. Render the standup:

   ```markdown
   ## Yesterday
   - WEEEK-123 <title> — Done
   - WEEEK-456 <title> — In Progress (3 commits)

   ## Today
   - WEEEK-456 <title> — continue
   - <any tasks user calls out>

   ## Blockers
   - <none unless user mentions them>
   ```

6. Do not call any write tool. Do not move tasks or post comments.

## What this skill does NOT do

- Does not push the report anywhere.
- Does not invent blockers — only echoes what the user says.
