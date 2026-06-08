import { pool } from "../db/pool.js";
import type { CollaborationEvent, CollaborationEventType } from "../types.js";

export async function appendCollaborationEvent(input: {
  workspaceId: string;
  userId: string;
  eventType: CollaborationEventType;
  payload: Record<string, unknown>;
}): Promise<CollaborationEvent> {
  const result = await pool.query(
    `WITH next_version AS (
       SELECT COALESCE(MAX(version), 0) + 1 AS version
       FROM collaboration_events
       WHERE workspace_id = $1
     )
     INSERT INTO collaboration_events (workspace_id, user_id, event_type, payload, version)
     SELECT $1, $2, $3, $4, version FROM next_version
     RETURNING id,
       workspace_id AS "workspaceId",
       user_id AS "userId",
       event_type AS "eventType",
       payload,
       version,
       created_at AS "createdAt"`,
    [input.workspaceId, input.userId, input.eventType, JSON.stringify(input.payload)]
  );

  return result.rows[0];
}

export async function listCollaborationEvents(workspaceId: string, afterVersion = 0): Promise<CollaborationEvent[]> {
  const result = await pool.query(
    `SELECT id,
       workspace_id AS "workspaceId",
       user_id AS "userId",
       event_type AS "eventType",
       payload,
       version,
       created_at AS "createdAt"
     FROM collaboration_events
     WHERE workspace_id = $1 AND version > $2
     ORDER BY version ASC
     LIMIT 500`,
    [workspaceId, afterVersion]
  );

  return result.rows;
}
