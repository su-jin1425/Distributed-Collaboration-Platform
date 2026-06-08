import { pool } from "../db/pool.js";
import type { WorkspaceRole } from "../types.js";

export async function createWorkspace(input: {
  workspaceName: string;
  createdBy: string;
}): Promise<{ id: string; workspaceName: string; createdBy: string; createdAt: string }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const workspace = await client.query(
      `INSERT INTO workspaces (workspace_name, created_by)
       VALUES ($1, $2)
       RETURNING id, workspace_name AS "workspaceName", created_by AS "createdBy", created_at AS "createdAt"`,
      [input.workspaceName, input.createdBy]
    );
    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [workspace.rows[0].id, input.createdBy]
    );
    await client.query("COMMIT");
    return workspace.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listWorkspacesForUser(userId: string) {
  const result = await pool.query(
    `SELECT w.id, w.workspace_name AS "workspaceName", wm.role, w.created_at AS "createdAt"
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function getWorkspaceRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
  const result = await pool.query(
    `SELECT role
     FROM workspace_members
     WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  );

  return result.rows[0]?.role ?? null;
}
