import { createServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { websocketConnections } from "../metrics.js";
import { channelForWorkspace, type CollaborationService } from "../services/collaborationService.js";
import { verifyToken } from "../services/authService.js";
import type { AuthenticatedUser, CollaborationEventType } from "../types.js";

type ClientMessage =
  | { type: "join_workspace"; workspaceId: string; token: string }
  | { type: "leave_workspace"; workspaceId: string }
  | {
      type: "collaboration_update" | "typing_indicator" | "cursor_update";
      workspaceId: string;
      payload: Record<string, unknown>;
      clientSentAt?: number;
    };

interface ClientContext {
  socket: WebSocket;
  user: AuthenticatedUser | null;
  workspaceIds: Set<string>;
}

export class CollaborationHub {
  private readonly clients = new Set<ClientContext>();
  private readonly workspaceClients = new Map<string, Set<ClientContext>>();
  private readonly subscribedWorkspaces = new Set<string>();
  private readonly server = createServer();
  private readonly wss = new WebSocketServer({ server: this.server });

  constructor(private readonly collaboration: CollaborationService) {
    this.collaboration.subscriber.on("message", (channel, message) => {
      const [, workspaceId] = channel.split(":");
      this.broadcast(workspaceId, { type: "event_broadcast", event: JSON.parse(message) });
    });
  }

  start(): void {
    this.wss.on("connection", (socket) => {
      const context: ClientContext = { socket, user: null, workspaceIds: new Set() };
      this.clients.add(context);
      websocketConnections.set(this.clients.size);

      socket.on("message", (raw) => {
        this.handleMessage(context, raw.toString()).catch((error) => {
          logger.warn({ error }, "websocket message rejected");
          this.send(socket, { type: "error", message: "message_rejected" });
        });
      });

      socket.on("close", () => this.disconnect(context));
    });

    this.server.listen(config.WS_PORT, () => {
      logger.info({ port: config.WS_PORT }, "websocket service listening");
    });
  }

  async subscribeWorkspace(workspaceId: string): Promise<void> {
    if (this.subscribedWorkspaces.has(workspaceId)) {
      return;
    }

    await this.collaboration.subscriber.subscribe(channelForWorkspace(workspaceId));
    this.subscribedWorkspaces.add(workspaceId);
  }

  private async handleMessage(context: ClientContext, rawMessage: string): Promise<void> {
    const message = JSON.parse(rawMessage) as ClientMessage;

    if (message.type === "join_workspace") {
      const user = await verifyToken(message.token);
      context.user = user;
      context.workspaceIds.add(message.workspaceId);

      const clients = this.workspaceClients.get(message.workspaceId) ?? new Set<ClientContext>();
      clients.add(context);
      this.workspaceClients.set(message.workspaceId, clients);

      await this.subscribeWorkspace(message.workspaceId);
      this.broadcast(message.workspaceId, {
        type: "user_joined",
        workspaceId: message.workspaceId,
        user: { id: user.id, name: user.name }
      });
      return;
    }

    if (!context.user) {
      throw new Error("UNAUTHENTICATED_SOCKET");
    }

    if (message.type === "leave_workspace") {
      this.leaveWorkspace(context, message.workspaceId);
      return;
    }

    const eventType = mapClientEvent(message.type);
    await this.collaboration.recordEvent({
      workspaceId: message.workspaceId,
      user: context.user,
      eventType,
      payload: message.payload,
      clientSentAt: message.clientSentAt
    });
  }

  private disconnect(context: ClientContext): void {
    for (const workspaceId of context.workspaceIds) {
      this.leaveWorkspace(context, workspaceId);
    }
    this.clients.delete(context);
    websocketConnections.set(this.clients.size);
  }

  private leaveWorkspace(context: ClientContext, workspaceId: string): void {
    context.workspaceIds.delete(workspaceId);
    this.workspaceClients.get(workspaceId)?.delete(context);
    if (context.user) {
      this.broadcast(workspaceId, {
        type: "user_left",
        workspaceId,
        user: { id: context.user.id, name: context.user.name }
      });
    }
  }

  private broadcast(workspaceId: string, payload: Record<string, unknown>): void {
    for (const client of this.workspaceClients.get(workspaceId) ?? []) {
      this.send(client.socket, payload);
    }
  }

  private send(socket: WebSocket, payload: Record<string, unknown>): void {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }
}

function mapClientEvent(type: "collaboration_update" | "typing_indicator" | "cursor_update"): CollaborationEventType {
  if (type === "collaboration_update") return "document.patch";
  if (type === "typing_indicator") return "typing.started";
  return "cursor.update";
}
