/**
 * weeek_create_task_comment — CMNT-02
 *
 * Posts a new comment on a WEEEK task. Plain text only — no HTML or markdown
 * rendering is guaranteed by the API. Returns the created comment.
 *
 * Write tool: MCP clients may prompt for confirmation.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekApiClient } from "../../client/weeek-api-client.js";
import { toMcpError } from "../../errors.js";
import { logger } from "../../logger.js";
import { jsonContent } from "../read/_helpers.js";

function unwrapComment(raw: unknown): unknown {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("comment" in obj) return obj.comment;
  }
  return raw;
}

const inputSchema = {
  task_id: z
    .string()
    .min(1)
    .describe(
      "WEEEK task ID to post the comment on. Required. Obtain from weeek_list_tasks."
    ),
  text: z
    .string()
    .min(1)
    .describe(
      "Comment body. Required, plain text. WEEEK may or may not render markdown — do not rely on formatting."
    ),
};

export function registerCreateTaskComment(
  server: McpServer,
  client: WeeekApiClient
): void {
  server.registerTool(
    "weeek_create_task_comment",
    {
      description:
        "Post a new comment on a WEEEK task. WRITE OPERATION — the MCP client may prompt for confirmation. Required: task_id and text (plain text, non-empty). Returns the created comment. Use this when the user wants to add a note, status update, or response to a task conversation. To READ existing comments on a task, use weeek_list_task_comments instead. task_id must come from weeek_list_tasks — do not guess.",
      inputSchema,
    },
    async (args: { task_id: string; text: string }) => {
      try {
        const body = { text: args.text };
        const raw = await client.post<unknown>(
          `/tm/tasks/${encodeURIComponent(args.task_id)}/comments`,
          body
        );
        const comment = unwrapComment(raw);
        return jsonContent(comment);
      } catch (err) {
        return toMcpError(err);
      }
    }
  );
  logger.info("Registered tool: weeek_create_task_comment");
}
