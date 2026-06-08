import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { FastifyError } from "fastify";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { authRoutes } from "./auth.js";
import { collaborationRoutes } from "./collaboration.js";
import { monitoringRoutes } from "./monitoring.js";
import { workspaceRoutes } from "./workspaces.js";
import type { CollaborationService } from "../services/collaborationService.js";

export async function buildHttpServer(collaboration: CollaborationService) {
  const app = Fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute"
  });

  await app.register(authRoutes);
  await app.register(workspaceRoutes);
  await app.register(async (router) => collaborationRoutes(router, collaboration));
  await app.register(monitoringRoutes);

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.message === "UNAUTHENTICATED" || error.message === "INVALID_TOKEN") {
      return reply.code(401).send({ message: "unauthenticated" });
    }
    if (error.message === "FORBIDDEN_WORKSPACE_WRITE") {
      return reply.code(403).send({ message: "forbidden" });
    }
    if (error.message === "EMAIL_ALREADY_REGISTERED") {
      return reply.code(409).send({ message: "email_already_registered" });
    }
    if (error.message === "INVALID_CREDENTIALS") {
      return reply.code(401).send({ message: "invalid_credentials" });
    }

    logger.error({ error }, "unhandled request error");
    return reply.code(500).send({ message: "internal_error" });
  });

  return app;
}
