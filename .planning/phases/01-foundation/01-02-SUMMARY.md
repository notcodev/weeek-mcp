---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [typescript, logger, config, errors, fetch, bearer-auth, mcp]

requires:
  - 01-01 (package.json, tsconfig.json, ESLint no-console rule, node_modules)

provides:
  - src/logger.ts — stderr-only log wrapper (console.error/warn) used by all modules
  - src/config.ts — loadConfig() with fail-fast WEEEK_API_TOKEN validation + DEFAULT_LIST_LIMIT=20
  - src/errors.ts — WeeekApiError, WeeekTimeoutError, toMcpError() normalizing to isError:true
  - src/client/weeek-api-client.ts — WeeekApiClient with Bearer auth, 30s timeout, error normalization

affects:
  - 01-03 (server entry point — imports loadConfig, WeeekApiClient, toMcpError, logger)
  - all future tool handlers (import toMcpError from errors.ts, logger from logger.ts)

tech-stack:
  added:
    - "native fetch (Node 20 built-in) — no axios"
    - "AbortController for 30s request timeout"
  patterns:
    - "All logging via logger.ts — routes info/warn/error to console.error (stderr)"
    - "NodeNext .js extension on all relative imports (mandatory for NodeNext ESM)"
    - "toMcpError() is the single error conversion path — never throw from tool handlers"
    - "loadConfig() fails fast with clear message — no silent 401s"

key-files:
  created:
    - src/logger.ts
    - src/config.ts
    - src/errors.ts
    - src/client/weeek-api-client.ts
  modified:
    - tsconfig.json (added types:["node"] — auto-fix for NodeJS namespace resolution)

key-decisions:
  - "logger.info routes to console.error — all methods use stderr; console.warn for warn level"
  - "DEFAULT_LIST_LIMIT=20 — INFRA-07 mitigation, prevents 25K token cap violations"
  - "WeeekApiClient rejects empty token in constructor — defense-in-depth after loadConfig validation"
  - "Empty response body returns undefined (not error) — WEEEK returns 204 on some mutations"
  - "types:[node] added to tsconfig — required for NodeJS.ProcessEnv namespace with NodeNext resolution"

requirements-completed: [INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-07]

duration: ~3min
completed: 2026-04-09
---

# Phase 01 Plan 02: Core Infrastructure Modules Summary

**Four TypeScript infrastructure modules compiled under strict NodeNext ESM: stderr-only logger, fail-fast env config with DEFAULT_LIST_LIMIT=20, WeeekApiError/toMcpError normalization, and WeeekApiClient using native fetch with Bearer auth and 30s AbortController timeout**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-09T13:15:47Z
- **Completed:** 2026-04-09T13:18:21Z
- **Tasks:** 3
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments

- `src/logger.ts` created: exports `logger` object with `info`, `warn`, `error` — all routing to stderr via `console.error`/`console.warn`. No `console.log` anywhere in executable code.
- `src/config.ts` created: `loadConfig()` reads `WEEEK_API_TOKEN` from env, throws `MissingConfigError` with actionable message if missing. Exports `DEFAULT_LIST_LIMIT=20` (INFRA-07 mitigation for 25K token cap). Token value never appears in error messages.
- `src/errors.ts` created: `WeeekApiError` (status + body), `WeeekTimeoutError`, `toMcpError()` converting any error to `{ content: [...], isError: true }`. Status-specific human messages for 401, 403, 404, 429, 5xx.
- `src/client/weeek-api-client.ts` created: `WeeekApiClient` class with `get`, `post`, `put`, `patch` methods. Uses native `fetch` + `AbortController` (30s timeout). Bearer token in Authorization header per-request. Throws `WeeekApiError` on non-2xx. Never logs token or query strings.
- `tsc --noEmit` passes with zero errors across all four source files.

## Task Commits

1. **Task 1: Create stderr-only logger and config modules** - `cc9f1a1` (feat)
2. **Task 2: Create error normalization module** - `57f2fcc` (feat)
3. **Task 3: Create WeeekApiClient with bearer auth and timeout** - `6043d05` (feat)

## Exported Symbols (for Plan 03 consumption)

### src/logger.ts
```typescript
export const logger: {
  info(message: string, meta?: unknown): void;   // → console.error
  warn(message: string, meta?: unknown): void;   // → console.warn
  error(message: string, meta?: unknown): void;  // → console.error
}
```

### src/config.ts
```typescript
export const DEFAULT_LIST_LIMIT = 20;
export const MAX_LIST_LIMIT = 50;
export const DEFAULT_BASE_URL = "https://api.weeek.net/public/v1";
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
export interface WeeekConfig { token, baseUrl, defaultListLimit, maxListLimit, requestTimeoutMs }
export class MissingConfigError extends Error {}
export function loadConfig(env?: NodeJS.ProcessEnv): WeeekConfig  // throws MissingConfigError
```

### src/errors.ts
```typescript
export class WeeekApiError extends Error { status: number; body: string }
export class WeeekTimeoutError extends Error {}
export interface McpErrorResponse { content: [{type:"text"; text:string}]; isError: true }
export function toMcpError(err: unknown): McpErrorResponse
```

### src/client/weeek-api-client.ts
```typescript
export type QueryParams = Record<string, string | number | boolean | undefined | null>
export interface WeeekApiClientOptions { baseUrl?: string; timeoutMs?: number }
export class WeeekApiClient {
  constructor(token: string, options?: WeeekApiClientOptions)
  get<T>(path: string, query?: QueryParams): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  put<T>(path: string, body: unknown): Promise<T>
  patch<T>(path: string, body: unknown): Promise<T>
}
```

## NodeNext ESM Import Convention

All relative imports in `.ts` source files MUST use `.js` extension:

```typescript
import { logger } from "./logger.js";          // correct
import { WeeekApiError } from "../errors.js";  // correct
import { logger } from "./logger";             // WRONG — breaks at runtime
```

TypeScript does NOT rewrite extensions at build time with NodeNext. The `.js` extension in source is required and refers to the compiled output file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] tsconfig missing types:["node"] for NodeJS namespace**
- **Found during:** Task 3 (tsc --noEmit after creating all four files)
- **Issue:** `tsc --noEmit` failed with `TS2503: Cannot find namespace 'NodeJS'` and `TS2591: Cannot find name 'process'` in `src/config.ts`. The `loadConfig(env: NodeJS.ProcessEnv)` signature requires the Node types namespace which was not explicitly referenced in tsconfig.
- **Fix:** Added `"types": ["node"]` to `compilerOptions` in `tsconfig.json`. This makes `@types/node` (already installed as a devDependency) available to tsc without requiring triple-slash references.
- **Files modified:** `tsconfig.json`
- **Commit:** `6043d05` (included in Task 3 commit)

## Known Stubs

None — all four modules are fully functional with real implementations.

## Self-Check: PASSED

- src/logger.ts: FOUND
- src/config.ts: FOUND
- src/errors.ts: FOUND
- src/client/weeek-api-client.ts: FOUND
- Commit cc9f1a1: FOUND
- Commit 57f2fcc: FOUND
- Commit 6043d05: FOUND
- tsc --noEmit: PASS (zero errors)
- No executable console.log in src/: PASS

---
*Phase: 01-foundation*
*Completed: 2026-04-09*
