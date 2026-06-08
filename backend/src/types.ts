export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type CollaborationEventType =
  | "document.patch"
  | "cursor.update"
  | "typing.started"
  | "typing.stopped"
  | "presence.joined"
  | "presence.left";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface CollaborationEvent {
  id: string;
  workspaceId: string;
  userId: string;
  eventType: CollaborationEventType;
  payload: Record<string, unknown>;
  version: number;
  createdAt: string;
}

export interface PresenceState {
  userId: string;
  name: string;
  workspaceId: string;
  lastSeenAt: string;
}
