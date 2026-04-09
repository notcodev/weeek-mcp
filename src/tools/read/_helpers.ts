/**
 * Shared helpers for Phase 2 read tools.
 *
 * - listParamsSchema: Zod schema for limit/offset enforcing DEFAULT_LIST_LIMIT=20
 *   and MAX_LIST_LIMIT=50 (INFRA-07 mitigation against 25k token cap).
 * - extractArray: tolerantly picks an array from a WEEEK API response body.
 * - jsonContent: wraps a value into the MCP text-content response shape.
 *
 * All response shapers are intentionally defensive — WEEEK API response shapes
 * are unverified, so shapers use optional chaining and tolerate missing fields.
 */
import { z } from "zod";
import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from "../../config.js";

export const listParamsSchema = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(DEFAULT_LIST_LIMIT)
    .describe(
      `Maximum number of items to return (1-${MAX_LIST_LIMIT}, default: ${DEFAULT_LIST_LIMIT}). Default protects against 25k-token MCP response cap.`
    )
    .optional(),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of items to skip for pagination (default: 0)")
    .optional(),
};

/**
 * Extract array from a WEEEK list response. WEEEK typically wraps lists as
 * { success: true, projects: [...] } or { tasks: [...], hasMore: bool }.
 * This tolerantly picks the array from the named key, or the first array
 * value on the object as a fallback.
 */
export function extractArray<T>(body: unknown, key: string): T[] {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (Array.isArray(obj[key])) return obj[key] as T[];
    // Fallback: first array value on the object
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

/**
 * Wrap an object into the MCP text-content response shape.
 */
export function jsonContent(value: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(value, null, 2) },
    ],
  };
}
