/**
 * Read tool group for WEEEK MCP server.
 *
 * INFRA-06: Read tools live in this group separate from write tools so MCP
 * clients (Claude Desktop, Cursor) can configure auto-approve per group.
 *
 * 7 read tools registered:
 *   Navigation: list_projects, get_project, list_boards, list_board_columns
 *   Tasks: list_tasks, get_task
 *   Workspace: list_workspace_members
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WeeekApiClient } from "../../client/weeek-api-client.js";
import { logger } from "../../logger.js";
import { registerListProjects } from "./list-projects.js";
import { registerGetProject } from "./get-project.js";
import { registerListBoards } from "./list-boards.js";
import { registerListBoardColumns } from "./list-board-columns.js";
import { registerListTasks } from "./list-tasks.js";
import { registerGetTask } from "./get-task.js";
import { registerListWorkspaceMembers } from "./list-workspace-members.js";

export function registerReadTools(
  server: McpServer,
  client: WeeekApiClient
): void {
  // Navigation
  registerListProjects(server, client);
  registerGetProject(server, client);
  registerListBoards(server, client);
  registerListBoardColumns(server, client);

  // Tasks
  registerListTasks(server, client);
  registerGetTask(server, client);

  // Workspace
  registerListWorkspaceMembers(server, client);

  logger.info("registerReadTools: 7 read tools registered");
}
