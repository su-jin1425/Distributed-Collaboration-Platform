export interface CollaborationEvent {
  id: string;
  workspaceId: string;
  userId: string;
  eventType: "document.patch" | "cursor.update" | "typing.started" | "typing.stopped" | "presence.joined" | "presence.left";
  payload: Record<string, unknown>;
  version: number;
  createdAt: string;
}

export interface PresenceUser {
  id: string;
  name: string;
}
