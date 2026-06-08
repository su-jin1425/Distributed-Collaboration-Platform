# Distributed Collaboration Platform

Version 1 is a TypeScript-first real-time collaboration platform. It includes a Next.js workspace UI, a Node.js API service, a standalone WebSocket gateway, Redis Pub/Sub fanout, PostgreSQL persistence, Docker Compose deployment, and Prometheus/Grafana observability.

This repository is intentionally evidence-oriented. It documents implemented behavior, exposes metrics, and includes validation hooks so capabilities can be verified by running the system.

## Implemented In This Slice

- User registration, login, JWT verification, and bcrypt password hashing.
- Workspace creation and membership ownership.
- Append-only collaboration event persistence with per-workspace event versions.
- WebSocket workspace joining, leaving, document update, cursor, typing, and broadcast flows.
- Redis Pub/Sub propagation for workspace events.
- PostgreSQL schema for users, workspaces, members, sessions, events, notifications, and execution metrics.
- Prometheus metrics for active WebSocket connections, collaboration event throughput, and sync latency.
- Grafana provisioning for a collaboration overview dashboard.
- Next.js collaboration workspace with connection controls, shared document editor, presence panel, and activity stream.

## Current Boundaries

- Conflict resolution is currently append-only event ordering, not OT or CRDT merging.
- Notifications have schema support, but API routes and workers are not implemented yet.
- Multi-tenant billing, audit exports, advanced RBAC, and SSO are roadmap items.
- The benchmark script measures current WebSocket latency; it does not assert a percentage improvement without a baseline run.

## Local Setup

```bash
cp .env.example .env
npm.cmd install
npm.cmd run dev
```

The combined development command starts:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- WebSocket service: `ws://localhost:8001`

For containerized deployment:

```bash
docker compose up --build
```

Containerized services:

- Frontend: `http://localhost:3000`
- API health: `http://localhost:8000/monitoring/health`
- API metrics: `http://localhost:8000/monitoring/metrics`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## API Flow

Register:

```bash
curl -X POST http://localhost:8000/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Sujith\",\"email\":\"sujith@example.com\",\"password\":\"password123\"}"
```

Create workspace:

```bash
curl -X POST http://localhost:8000/workspaces ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <token>" ^
  -d "{\"workspaceName\":\"Engineering\"}"
```

Use the returned token and workspace ID in the frontend connection panel.

## Benchmark Hook

After creating a user and workspace:

```bash
$env:AUTH_TOKEN="<token>"
$env:WORKSPACE_ID="<workspace-id>"
$env:CLIENTS="25"
$env:EVENTS_PER_CLIENT="50"
npm.cmd run bench:ws --workspace backend
```

The script reports average and p95 WebSocket event latency for the current deployment.

## Roadmap

- Add notification APIs and Redis-backed background workers.
- Add workspace member invitations, role changes, and permission tests.
- Replace append-only document patches with CRDT-backed document state.
- Add API integration tests against PostgreSQL and Redis containers.
- Add Playwright tests for multi-client collaboration behavior.
- Add OpenTelemetry traces and alert rules for latency and event loss.
- Add production Nginx, TLS, and Kubernetes manifests.
