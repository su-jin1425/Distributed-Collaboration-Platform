import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { verifyToken } from "../services/authService.js";
import { CollaborationService } from "../services/collaborationService.js";
import type { AuthenticatedUser, CollaborationEventType } from "../types.js";

const eventBody = z.object({
  workspaceId: z.string().uuid(),
  eventType: z.enum(["document.patch", "cursor.update", "typing.started", "typing.stopped", "presence.joined", "presence.left"]),
  payload: z.record(z.unknown()),
  clientSentAt: z.number().optional()
});

export async function collaborationRoutes(app: FastifyInstance, service: CollaborationService): Promise<void> {
  app.post("/collaboration/events", async (request, reply) => {
    const user = await requireUser(request);
    const body = eventBody.parse(request.body);
    const event = await service.recordEvent({
      workspaceId: body.workspaceId,
      user,
      eventType: body.eventType as CollaborationEventType,
      payload: body.payload,
      clientSentAt: body.clientSentAt
    });
    return reply.code(202).send({ event });
  });

  app.get("/collaboration/history/:workspaceId", async (request) => {
    const params = z.object({ workspaceId: z.string().uuid() }).parse(request.params);
    const query = z.object({ afterVersion: z.coerce.number().int().nonnegative().default(0) }).parse(request.query);
    return { events: await service.history(params.workspaceId, query.afterVersion) };
  });
}

async function requireUser(request: FastifyRequest): Promise<AuthenticatedUser> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }

  return verifyToken(header.slice("Bearer ".length));
}
