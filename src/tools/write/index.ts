/**
 * Write tool group for WEEEK MCP server.
 *
 * INFRA-06: Write tools live in this group separate from read tools so MCP
 * clients can require user confirmation for mutations while auto-approving reads.
 *
 * Phase 1: This function is intentionally empty. Phase 3 will add mutation
 * tools here (weeek_create_task, weeek_update_task, etc.).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekApiClient } from "../../client/weeek-api-client.js";
import { logger } from "../../logger.js";

export function registerWriteTools(
  _server: McpServer,
  _client: WeeekApiClient
): void {
  // Phase 1: no write tools yet. Phase 3 adds:
  //   - weeek_create_task
  //   - weeek_update_task
  //   - weeek_move_task
  //   - weeek_complete_task
  //   - weeek_create_task_comment
  logger.info("registerWriteTools: 0 write tools registered (Phase 1 skeleton)");
}
