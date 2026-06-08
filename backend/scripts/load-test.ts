import WebSocket from "ws";

const wsUrl = process.env.WS_URL ?? "ws://localhost:8001";
const token = process.env.AUTH_TOKEN;
const workspaceId = process.env.WORKSPACE_ID;
const clients = Number(process.env.CLIENTS ?? "10");
const eventsPerClient = Number(process.env.EVENTS_PER_CLIENT ?? "20");

if (!token || !workspaceId) {
  throw new Error("AUTH_TOKEN and WORKSPACE_ID are required");
}

const latencies: number[] = [];
let receivedEvents = 0;
const expectedEvents = clients * eventsPerClient * clients;

await Promise.all(
  Array.from({ length: clients }, (_, clientIndex) => {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(wsUrl);

      socket.on("open", () => {
        socket.send(JSON.stringify({ type: "join_workspace", workspaceId, token }));

        for (let eventIndex = 0; eventIndex < eventsPerClient; eventIndex += 1) {
          const clientSentAt = Date.now();
          socket.send(
            JSON.stringify({
              type: "collaboration_update",
              workspaceId,
              payload: { text: `client ${clientIndex} event ${eventIndex}`, clientSentAt },
              clientSentAt
            })
          );
        }
      });

      socket.on("message", (message) => {
        const data = JSON.parse(message.toString());
        if (data.type !== "event_broadcast") return;

        const sentAt = data.event?.payload?.clientSentAt;
        if (typeof sentAt === "number") {
          latencies.push(Date.now() - sentAt);
        }

        receivedEvents += 1;
        if (receivedEvents >= expectedEvents) {
          socket.close();
          resolve();
        }
      });

      socket.on("error", reject);
      setTimeout(resolve, 30_000);
    });
  })
);

latencies.sort((a, b) => a - b);
const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
const average = latencies.reduce((sum, value) => sum + value, 0) / Math.max(latencies.length, 1);

console.log(
  JSON.stringify(
    {
      clients,
      eventsPerClient,
      receivedEvents,
      averageLatencyMs: Number(average.toFixed(2)),
      p95LatencyMs: p95
    },
    null,
    2
  )
);
