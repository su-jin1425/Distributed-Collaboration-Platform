import { Redis } from "ioredis";
import { config } from "../config.js";
import { appendCollaborationEvent, listCollaborationEvents } from "../repositories/eventRepository.js";
import { getWorkspaceRole } from "../repositories/workspaceRepository.js";
import { collaborationEventsTotal, syncLatencyMs } from "../metrics.js";
import type { AuthenticatedUser, CollaborationEventType } from "../types.js";

const writeRoles = new Set(["owner", "admin", "editor"]);

export class CollaborationService {
  private readonly publisher = new Redis(config.REDIS_URL);
  readonly subscriber = new Redis(config.REDIS_URL);

  async recordEvent(input: {
    workspaceId: string;
    user: AuthenticatedUser;
    eventType: CollaborationEventType;
    payload: Record<string, unknown>;
    clientSentAt?: number;
  }) {
    const role = await getWorkspaceRole(input.workspaceId, input.user.id);
    if (!role || !writeRoles.has(role)) {
      throw new Error("FORBIDDEN_WORKSPACE_WRITE");
    }

    const event = await appendCollaborationEvent({
      workspaceId: input.workspaceId,
      userId: input.user.id,
      eventType: input.eventType,
      payload: input.payload
    });

    collaborationEventsTotal.inc({ event_type: input.eventType });
    if (input.clientSentAt) {
      syncLatencyMs.observe(Date.now() - input.clientSentAt);
    }

    await this.publisher.publish(channelForWorkspace(input.workspaceId), JSON.stringify(event));
    return event;
  }

  history(workspaceId: string, afterVersion = 0) {
    return listCollaborationEvents(workspaceId, afterVersion);
  }

  async close(): Promise<void> {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
  }
}

export function channelForWorkspace(workspaceId: string): string {
  return `workspace:${workspaceId}:events`;
}
