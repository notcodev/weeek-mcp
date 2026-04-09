/**
 * Read tool group for WEEEK MCP server.
 *
 * INFRA-06: Read tools live in this group separate from write tools so MCP
 * clients (Claude Desktop, Cursor) can configure auto-approve per group.
 *
 * Phase 2 (Plan 02-01): navigation tools — projects, boards, board columns.
 * Phase 2 (Plan 02-02): task + comment tools — list_tasks, get_task, list_task_comments.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekApiClient } from "../../client/weeek-api-client.js";
import { logger } from "../../logger.js";
import { registerListProjects } from "./list-projects.js";
import { registerGetProject } from "./get-project.js";
import { registerListBoards } from "./list-boards.js";
import { registerListBoardColumns } from "./list-board-columns.js";

export function registerReadTools(
  server: McpServer,
  client: WeeekApiClient
): void {
  registerListProjects(server, client);
  registerGetProject(server, client);
  registerListBoards(server, client);
  registerListBoardColumns(server, client);
  logger.info("registerReadTools: 4 navigation tools registered (Phase 2 Plan 01)");
}
