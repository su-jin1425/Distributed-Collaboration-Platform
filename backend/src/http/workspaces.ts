import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { createWorkspace, listWorkspacesForUser } from "../repositories/workspaceRepository.js";
import { verifyToken } from "../services/authService.js";
import type { AuthenticatedUser } from "../types.js";

export async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  app.post("/workspaces", async (request, reply) => {
    const user = await requireUser(request);
    const body = z.object({ workspaceName: z.string().min(2).max(100) }).parse(request.body);
    const workspace = await createWorkspace({ workspaceName: body.workspaceName, createdBy: user.id });
    return reply.code(201).send({ workspace });
  });

  app.get("/workspaces", async (request) => {
    const user = await requireUser(request);
    return { workspaces: await listWorkspacesForUser(user.id) };
  });
}

async function requireUser(request: FastifyRequest): Promise<AuthenticatedUser> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }

  return verifyToken(header.slice("Bearer ".length));
}
