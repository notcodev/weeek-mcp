<!-- GSD:project-start source:PROJECT.md -->
## Project

**WEEEK MCP Server**

MCP (Model Context Protocol) сервер для интеграции AI-агентов с таск-трекером WEEEK. Позволяет кодинг-агентам (Claude Desktop, Cursor, и др.) читать задачи, обновлять статусы, оставлять комментарии и навигировать по проектам/доскам через WEEEK Public API. Распространяется как npm-пакет (`weeek-mcp-server`), запускается через `npx`.

**Core Value:** Кодинг-агенты получают прямой доступ к контексту задач в WEEEK — без переключения контекста разработчиком.

### Constraints

- **Tech stack**: TypeScript, MCP SDK (`@modelcontextprotocol/sdk`), npm package
- **API**: WEEEK Public API v1 — все возможности ограничены тем, что предоставляет API
- **Transport**: stdio (стандарт для npx MCP серверов)
- **Auth**: Bearer token через переменную окружения WEEEK_API_TOKEN
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@modelcontextprotocol/sdk` | `^1.29.0` | MCP protocol implementation — stdio transport, tool/resource registration | Official Anthropic SDK. v1.29.0 is latest stable (March 30, 2026). v2 alpha exists but is pre-release; v1.x gets security fixes for at least 6 months post-v2 stable. 39,918 projects use it on npm. |
| TypeScript | `^6.0.2` | Type safety, compilation | Latest stable (released ~March 2026). Breaking change from 5.x: `moduleResolution: classic` removed, `target: es5` deprecated — NodeNext is now the unambiguous standard. Strict mode catches API shape mistakes at compile time. |
| Node.js | `>=20.0.0` | Runtime | v20 is LTS. Native `fetch` is stable and available. Required for `"type": "module"` and NodeNext resolution to work correctly. |
| `zod` | `^3.25.0` | Runtime schema validation for tool input schemas | MCP SDK 1.29 internally uses zod/v4 but maintains backwards compatibility with Zod v3.25+. **Do not upgrade to Zod v4 independently** — there was a documented incompatibility (SDK issues #906, #925) that is only cleanly resolved in SDK v2. Use v3.25+ for safety. |
### HTTP Client
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Native `fetch` | built-in (Node 20+) | Outbound calls to WEEEK Public API v1 | Zero dependencies. Node 20 `fetch` is stable and mature. WEEEK API is a simple Bearer-token REST API — no streaming, no complex retry logic needed. Axios adds ~50KB to the bundle and its advantages (interceptors, auto-JSON) are trivially replicated with a thin wrapper. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsx` | `^4.x` | Dev-time TypeScript execution | Development and watch mode only. Eliminates build step during iteration. `tsx watch src/index.ts` is the dev loop. Not used in production. |
| `@modelcontextprotocol/inspector` | latest | Interactive MCP testing during development | Official inspector tool. Test tools manually before writing unit tests. Run via `npx @modelcontextprotocol/inspector`. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| `tsc` (TypeScript compiler) | Production build — compiles `src/` → `dist/` | Use directly, not wrapped by tsup/esbuild. MCP servers are Node-only, no bundling needed. `tsc` output is cleaner for debugging and stdio transport. |
| `vitest` | Unit tests | Fastest test runner for ESM TypeScript projects in 2026 (10-20x faster startup than Jest). Native ESM support without configuration. Use `InMemoryTransport` from the SDK for integration tests. |
| `@types/node` | TypeScript types for Node.js APIs | Required for `process.env`, `process.stdin/stdout`, etc. |
## TypeScript Configuration
## Package.json Configuration for npx Distribution
- `"type": "module"` — enables ESM across the project
- `"bin"` field — single entry means `npx weeek-mcp-server` runs without a subcommand
- Entry file `src/index.ts` must have `#!/usr/bin/env node` as its first line
- `postbuild` script: `chmod +x dist/index.js` (or use `prepublishOnly` to handle this)
- `"files": ["dist"]` — prevents source files, node_modules, and dev configs from being published
- `"engines"` — protects against users running on Node 18 where fetch may have edge cases
## Installation
# Core runtime dependencies
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native `fetch` | `axios` | If you need request interceptors, automatic retry with backoff, or are integrating with a complex API requiring multipart uploads. WEEEK API needs none of this. |
| Native `fetch` | `got` | If you need advanced streaming, pagination helpers, or RFC-compliant redirect handling. Overkill for a simple CRUD API wrapper. |
| `tsc` (direct) | `tsup` | If your server needs to run in a browser or Bun runtime, or if you have complex bundling requirements. For stdio-only Node.js MCP servers, bundling adds complexity without benefit. |
| `tsc` (direct) | `esbuild` | Same as tsup — fine for bundling, but MCP servers don't need bundling. |
| `vitest` | `jest` | If your project is in a monorepo that already mandates Jest, or if you need specific Jest plugins unavailable in Vitest. For greenfield, Vitest has no downside. |
| `@modelcontextprotocol/sdk` v1.x | v2 alpha | v2 adds Streamable HTTP transport, OAuth 2.1, and framework middleware packages. Once stable, it's the upgrade path. For this server (stdio-only, Bearer token auth), v1 is complete and correct. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `zod` v4 (standalone upgrade) | Active incompatibility with MCP SDK v1.x (SDK issues #906, #925 — "w._parse is not a function" errors). SDK 1.x was written against zod v3 internals. | `zod` ^3.25.0 (SDK 1.29 adds v4 compatibility internally, but don't independently install zod 4 alongside SDK 1.x without testing) |
| `console.log()` for logging | MCP communicates over stdout. Any `console.log` will corrupt the stdio transport and break the protocol. | `console.error()` — writes to stderr, which MCP clients display as debug output and does not interfere with the protocol |
| CommonJS (`require`, `module.exports`) | MCP SDK is ESM-only. Mixing CJS and ESM in Node causes `ERR_REQUIRE_ESM` at runtime. | ESM throughout: `"type": "module"` in package.json, `import`/`export` syntax |
| SSE/HTTP transport | Out of scope per PROJECT.md. Adds server infrastructure requirements, session management complexity. npx + stdio covers Claude Desktop, Cursor, and all major coding agents. | `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js` |
| `ts-node` | Deprecated in practice for ESM. Requires `--esm` flag and has known quirks with NodeNext resolution. | `tsx` — drop-in replacement, zero configuration, correct ESM handling |
## Version Compatibility
| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@modelcontextprotocol/sdk@^1.29.0` | `zod@^3.25.0` | SDK 1.29 internally uses zod/v4 API but accepts v3.25+ as peer dep. Do not mix SDK 1.x + zod 4.x without confirming no "._parse" errors. |
| `typescript@^6.0.2` | `@types/node@^22.0.0` | TS 6 requires `@types/node` 20+ for accurate types. |
| `tsx@^4.x` | `typescript@^6.0.2` | tsx 4.x supports TS 6. tsx uses esbuild internally and ignores most tsconfig options — it does not enforce strict mode during dev. Production `tsc` will catch those. |
| `vitest@^3.0.0` | `typescript@^6.0.2` | Vitest 3 has first-class TS 6 support. Uses Vite under the hood; no special configuration needed for NodeNext resolution in test files. |
## Logging Pattern (Critical)
## Sources
- [modelcontextprotocol/typescript-sdk GitHub](https://github.com/modelcontextprotocol/typescript-sdk) — v1.29.0 confirmed latest stable (March 30, 2026) — HIGH confidence
- [typescript-sdk v1.x branch](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x) — peer dependency zod ^3.25 confirmed — HIGH confidence
- [Zod v4 incompatibility issue #925](https://github.com/modelcontextprotocol/typescript-sdk/issues/925) — "MCP SDK v1.17.5 Incompatible with Zod v4" — HIGH confidence (official repo)
- [Publish Your MCP Server To NPM — aihero.dev](https://www.aihero.dev/publish-your-mcp-server-to-npm) — package.json pattern verified — MEDIUM confidence
- [Build MCP Server with TypeScript — mcpize.com](https://mcpize.com/blog/mcp-server-typescript) — tsconfig and transport patterns — MEDIUM confidence
- [Announcing TypeScript 6.0 — devblogs.microsoft.com](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) — breaking changes confirmed — HIGH confidence
- [Vitest vs Jest 2026 — DEV Community](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb) — Vitest recommendation — MEDIUM confidence
- [npm @modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — 1.29.0 latest, 39,918 dependents — HIGH confidence
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
