import { config } from "./config.js";
import { migrate } from "./db/migrate.js";
import { logger } from "./logger.js";
import { buildHttpServer } from "./http/server.js";
import { CollaborationService } from "./services/collaborationService.js";
import { CollaborationHub } from "./websocket/hub.js";

async function main(): Promise<void> {
  await migrate();

  const collaboration = new CollaborationService();
  const app = await buildHttpServer(collaboration);
  const hub = new CollaborationHub(collaboration);

  hub.start();
  await app.listen({ host: "0.0.0.0", port: config.PORT });
  logger.info({ port: config.PORT }, "api service listening");
}

main().catch((error) => {
  logger.fatal({ error }, "service failed to start");
  process.exit(1);
});
