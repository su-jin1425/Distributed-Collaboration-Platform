import type { FastifyInstance } from "fastify";
import { registry } from "../metrics.js";
import { pool } from "../db/pool.js";

export async function monitoringRoutes(app: FastifyInstance): Promise<void> {
  app.get("/monitoring/health", async () => {
    await pool.query("SELECT 1");
    return { status: "ok", checkedAt: new Date().toISOString() };
  });

  app.get("/monitoring/metrics", async (_request, reply) => {
    reply.header("Content-Type", registry.contentType);
    return registry.metrics();
  });
}
