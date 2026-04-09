/**
 * weeek_get_task — TASK-02
 *
 * Returns full details of a single task by ID. Does NOT embed comments
 * (keeps response small; comments are fetched via weeek_list_task_comments).
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekApiClient } from "../../client/weeek-api-client.js";
import { toMcpError } from "../../errors.js";
import { logger } from "../../logger.js";
import { jsonContent } from "./_helpers.js";

const inputSchema = {
  task_id: z
    .string()
    .min(1)
    .describe("WEEEK task ID. Obtain from weeek_list_tasks. Required."),
};

export function registerGetTask(
  server: McpServer,
  client: WeeekApiClient
): void {
  server.registerTool(
    "weeek_get_task",
    {
      description:
        "Get full details of a single WEEEK task by ID. Use this AFTER weeek_list_tasks when an agent needs the complete task context — full description, priority, assignee, due date, board/column location, timestamps. Does NOT include comments (to stay under the 25k-token response cap). For comments on this task, call weeek_list_task_comments separately. The task_id must come from weeek_list_tasks — do not guess IDs.",
      inputSchema,
    },
    async (args: { task_id: string }) => {
      try {
        const raw = await client.get<unknown>(
          `/tm/tasks/${encodeURIComponent(args.task_id)}`
        );
        let task: unknown = raw;
        if (raw && typeof raw === "object" && "task" in (raw as object)) {
          task = (raw as Record<string, unknown>).task;
        }
        // Strip embedded comments array if present — per CONTEXT decision,
        // comments belong to list_task_comments, not get_task.
        if (task && typeof task === "object" && "comments" in (task as object)) {
          const { comments: _dropped, ...rest } = task as Record<string, unknown>;
          void _dropped;
          task = rest;
        }
        return jsonContent(task);
      } catch (err) {
        return toMcpError(err);
      }
    }
  );
  logger.info("Registered tool: weeek_get_task");
}
