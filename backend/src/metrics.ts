import client from "prom-client";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const websocketConnections = new client.Gauge({
  name: "collab_websocket_connections",
  help: "Active WebSocket connections"
});

export const syncLatencyMs = new client.Histogram({
  name: "collab_sync_latency_ms",
  help: "Measured synchronization latency in milliseconds",
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000]
});

export const collaborationEventsTotal = new client.Counter({
  name: "collab_events_total",
  help: "Collaboration events accepted by the backend",
  labelNames: ["event_type"]
});

registry.registerMetric(websocketConnections);
registry.registerMetric(syncLatencyMs);
registry.registerMetric(collaborationEventsTotal);
