/**
 * Read tool group for WEEEK MCP server.
 *
 * INFRA-06: Read tools live in this group separate from write tools so MCP
 * clients (Claude Desktop, Cursor) can configure auto-approve per group.
 *
 * Phase 1: This function is intentionally empty. Phase 2 will add navigation
 * and task-read tools here (weeek_list_projects, weeek_get_task, etc.) by
 * calling `server.registerTool(...)` for each tool.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekApiClient } from "../../client/weeek-api-client.js";
import { logger } from "../../logger.js";

export function registerReadTools(
  _server: McpServer,
  _client: WeeekApiClient
): void {
  // Phase 1: no read tools yet. Phase 2 adds:
  //   - weeek_list_projects
  //   - weeek_get_project
  //   - weeek_list_boards
  //   - weeek_list_board_columns
  //   - weeek_list_tasks (with DEFAULT_LIST_LIMIT enforcement)
  //   - weeek_get_task
  //   - weeek_list_task_comments
  logger.info("registerReadTools: 0 read tools registered (Phase 1 skeleton)");
}
