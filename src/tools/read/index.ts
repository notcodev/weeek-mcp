/**
 * Read tool group for WEEEK MCP server.
 *
 * INFRA-06: Read tools live in this group separate from write tools so MCP
 * clients (Claude Desktop, Cursor) can configure auto-approve per group.
 *
 * 8 read tools registered:
 *   Navigation: list_projects, get_project, list_boards, list_board_columns
 *   Tasks + Comments: list_tasks, get_task, list_task_comments
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
import { registerListTaskComments } from "./list-task-comments.js";
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

  // Tasks + Comments
  registerListTasks(server, client);
  registerGetTask(server, client);
  registerListTaskComments(server, client);

  // Workspace
  registerListWorkspaceMembers(server, client);

  logger.info("registerReadTools: 8 read tools registered");
}
