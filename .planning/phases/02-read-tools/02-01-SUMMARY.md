---
phase: 02-read-tools
plan: "01"
subsystem: read-tools/navigation
tags: [mcp, tools, read, navigation, zod, weeek-api]
dependency_graph:
  requires:
    - 01-03 (McpServer constructor, registerReadTools hook, WeeekApiClient, toMcpError, logger, config)
  provides:
    - listParamsSchema (src/tools/read/_helpers.ts)
    - extractArray (src/tools/read/_helpers.ts)
    - jsonContent (src/tools/read/_helpers.ts)
    - weeek_list_projects (NAV-01)
    - weeek_get_project (NAV-02)
    - weeek_list_boards (NAV-03)
    - weeek_list_board_columns (NAV-04)
  affects:
    - 02-02 (task/comment tools reuse _helpers.ts)
    - 03-write-tools (list_board_columns is prerequisite for move_task)
tech_stack:
  added: []
  patterns:
    - "server.registerTool(name, { description, inputSchema }, handler) — MCP SDK v1.29 non-deprecated API"
    - "inputSchema is a ZodRawShapeCompat (plain object of Zod schemas, NOT z.object(...))"
    - "Handler args are automatically typed from inputSchema shape via ToolCallback<Args>"
    - "Defensive shapers with RawFoo interfaces and optional chaining for all WEEEK API fields"
    - "extractArray tolerant fallback: named key first, then first array found on response object"
key_files:
  created:
    - src/tools/read/_helpers.ts
    - src/tools/read/list-projects.ts
    - src/tools/read/get-project.ts
    - src/tools/read/list-boards.ts
    - src/tools/read/list-board-columns.ts
  modified:
    - src/tools/read/index.ts
decisions:
  - "Used server.registerTool(name, { description, inputSchema }, cb) — the non-deprecated v1.29 API (server.tool() is deprecated per SDK d.ts comments)"
  - "inputSchema is a plain ZodRawShape object (ZodRawShapeCompat), NOT z.object(...) — this is the MCP SDK convention for v1.29"
  - "Handler args typed explicitly as { field: type } to avoid any implicit from SDK generics — redundant but improves readability"
  - "z import removed from list-projects.ts — listParamsSchema defined in _helpers.ts, not repeated in each tool file"
  - "extractArray falls back to first array in response if named key absent — defensive against undocumented WEEEK API shape changes"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-09"
  tasks_completed: 3
  files_created: 5
  files_modified: 1
---

# Phase 2 Plan 01: Navigation Read Tools Summary

Four navigation read tools (weeek_list_projects, weeek_get_project, weeek_list_boards, weeek_list_board_columns) implemented with shared `_helpers.ts` plumbing using `server.registerTool` MCP SDK v1.29 API, Zod input validation, and `toMcpError` error wrapping on all handlers.

## What Was Built

### Shared Helpers (`src/tools/read/_helpers.ts`)

Three exports that Plan 02-02 (task/comment tools) can consume directly:

```typescript
// Zod schema shape for limit + offset — spread into any list tool's inputSchema
export const listParamsSchema = { limit: z.number()..., offset: z.number()... }

// Tolerant WEEEK response array extractor
export function extractArray<T>(body: unknown, key: string): T[]

// MCP text-content wrapper
export function jsonContent(value: unknown): { content: [{ type: "text", text: string }] }
```

`listParamsSchema` enforces `DEFAULT_LIST_LIMIT=20` as default and `MAX_LIST_LIMIT=50` as the Zod max — directly satisfying INFRA-07.

### Tool Registration API

Confirmed via `node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.d.ts`:

- **Used:** `server.registerTool(name, { description, inputSchema }, handler)` — non-deprecated
- **Not used:** `server.tool(...)` — marked `@deprecated Use 'registerTool' instead` in every overload
- `inputSchema` must be `ZodRawShapeCompat` = a plain object of Zod schemas (e.g. `{ limit: z.number()... }`), NOT `z.object({ limit: z.number()... })`

### WEEEK API Endpoints

Endpoints used (paths relative to `https://api.weeek.net/public/v1` base URL already in WeeekApiClient):

| Tool | Endpoint | Query params |
|------|----------|-------------|
| weeek_list_projects | `GET /tm/projects` | limit, offset |
| weeek_get_project | `GET /tm/projects/{id}` | — |
| weeek_list_boards | `GET /tm/boards` | projectId, limit, offset |
| weeek_list_board_columns | `GET /tm/board-columns` | boardId, limit, offset |

No endpoint path corrections needed — the `/tm/*` paths were used as-is from the plan. Runtime verification via smoke test showed all 4 tools register successfully. Actual WEEEK API response shapes will be observed on first live use; the defensive extractArray + optional chaining shapers are designed to adapt without code changes if the shapes differ from expectations.

### Response Shape Strategy

Each list tool returns:
```json
{ "items": [...shaped objects...], "count": N }
```

Each shaped object keeps only stable, agent-useful fields:
- Projects: `{ id, name, parentId, isArchived }`
- Boards: `{ id, name, projectId, type }`
- Columns: `{ id, name, boardId, order }`

Full project details (get-project) pass through the unwrapped `project` field from the WEEEK envelope `{ success: true, project: {...} }`.

### Smoke Test Result

```
[weeek-mcp] info Registered tool: weeek_list_projects
[weeek-mcp] info Registered tool: weeek_get_project
[weeek-mcp] info Registered tool: weeek_list_boards
[weeek-mcp] info Registered tool: weeek_list_board_columns
[weeek-mcp] info registerReadTools: 4 navigation tools registered (Phase 2 Plan 01)
```

Stdout: empty (zero bytes). Stderr: 4 tool registrations + confirmation message.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `z` import from `list-projects.ts`**
- **Found during:** Task 1 verification
- **Issue:** `list-projects.ts` imported `z` from zod but didn't use it directly — `listParamsSchema` is imported from `_helpers.ts` where it's defined. The `void z;` suppressor added as workaround was not idiomatic.
- **Fix:** Removed the `import { z } from "zod"` line and the `void z;` suppressor from `list-projects.ts`. Lint passed cleanly.
- **Files modified:** `src/tools/read/list-projects.ts`
- **Commit:** 48c88b2

None other — plan executed as written.

## Exports Available for Plan 02-02

Plan 02-02 (task + comment tools) can import directly:

```typescript
import { listParamsSchema, extractArray, jsonContent } from "./_helpers.js";
```

- `listParamsSchema` — spread into any list tool's inputSchema
- `extractArray<T>(body, "tasks")` — pass the WEEEK envelope key for the list field
- `jsonContent(value)` — wrap any shaped result into MCP response

All four `register*` functions follow the same structure, making task/comment tools straightforward to add by copying the pattern.

## Known Stubs

None — all four tools are fully wired. Response shapes are defensive (tolerate missing fields) but the tools are not stubs. Live WEEEK API responses may surface missing fields which the shapers handle gracefully via `String(raw.field ?? "")` and null-coalescing patterns.

## Self-Check: PASSED
