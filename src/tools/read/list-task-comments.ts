/**
 * weeek_list_task_comments — CMNT-01
 *
 * Lists comments on a task. The exact WEEEK API path for comments is NOT
 * confirmed in our reference research (AlekMel Python server does not
 * expose a comments endpoint). This file uses /tm/tasks/{taskId}/comments
 * as the primary path and has a fallback to read from the get-task response.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekApiClient } from "../../client/weeek-api-client.js";
import { WeeekApiError, toMcpError } from "../../errors.js";
import { logger } from "../../logger.js";
import { extractArray, jsonContent, listParamsSchema } from "./_helpers.js";

interface RawComment {
  id?: string | number;
  text?: string;
  body?: string;
  content?: string;
  authorId?: string | number;
  userId?: string | number;
  createdAt?: string;
  [k: string]: unknown;
}

interface ShapedComment {
  id: string;
  text: string;
  authorId: string | null;
  createdAt: string | null;
}

function shapeComment(raw: RawComment): ShapedComment {
  return {
    id: String(raw.id ?? ""),
    text: String(raw.text ?? raw.body ?? raw.content ?? ""),
    authorId:
      raw.authorId != null
        ? String(raw.authorId)
        : raw.userId != null
        ? String(raw.userId)
        : null,
    createdAt: raw.createdAt == null ? null : String(raw.createdAt),
  };
}

const inputSchema = {
  task_id: z
    .string()
    .min(1)
    .describe("WEEEK task ID. Obtain from weeek_list_tasks. Required."),
  ...listParamsSchema,
};

export function registerListTaskComments(
  server: McpServer,
  client: WeeekApiClient
): void {
  server.registerTool(
    "weeek_list_task_comments",
    {
      description:
        "List comments on a WEEEK task. Use this AFTER weeek_get_task when an agent needs the discussion history for context before acting on a task. Comments are separated from weeek_get_task to stay under the 25k-token MCP response cap. Returns array of {id, text, authorId, createdAt}. The task_id must come from weeek_list_tasks or weeek_get_task — do not guess IDs.",
      inputSchema,
    },
    async (args: { task_id: string; limit?: number; offset?: number }) => {
      try {
        // Primary path — /tm/tasks/{taskId}/comments (endpoint unverified in research)
        const path = `/tm/tasks/${encodeURIComponent(args.task_id)}/comments`;
        try {
          const raw = await client.get<unknown>(path, {
            limit: args.limit,
            offset: args.offset,
          });
          const comments = extractArray<RawComment>(raw, "comments").map(
            shapeComment
          );
          return jsonContent({ comments, count: comments.length });
        } catch (primaryErr) {
          // Fallback: WEEEK may embed comments inside the task object.
          if (primaryErr instanceof WeeekApiError && primaryErr.status === 404) {
            logger.warn(
              "weeek_list_task_comments: primary endpoint 404, falling back to embedded task.comments",
              { path }
            );
            const raw = await client.get<unknown>(
              `/tm/tasks/${encodeURIComponent(args.task_id)}`
            );
            let task: Record<string, unknown> = {};
            if (raw && typeof raw === "object") {
              task =
                "task" in (raw as object)
                  ? ((raw as Record<string, unknown>).task as Record<
                      string,
                      unknown
                    >)
                  : (raw as Record<string, unknown>);
            }
            const rawComments = Array.isArray(task.comments)
              ? (task.comments as RawComment[])
              : [];
            const comments = rawComments.map(shapeComment);
            return jsonContent({
              comments,
              count: comments.length,
              note: "comments extracted from embedded task response (fallback path)",
            });
          }
          throw primaryErr;
        }
      } catch (err) {
        return toMcpError(err);
      }
    }
  );
  logger.info("Registered tool: weeek_list_task_comments");
}
