"use client";

import { Activity, Circle, Send, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useCollaborationSocket } from "../hooks/useCollaborationSocket";

export function CollaborationWorkspace() {
  const [token, setToken] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [draft, setDraft] = useState("Initial shared document state");
  const collaboration = useCollaborationSocket({
    token,
    workspaceId,
    enabled: Boolean(token && workspaceId)
  });

  const latestVersion = useMemo(() => {
    return collaboration.events.at(-1)?.version ?? 0;
  }, [collaboration.events]);

  return (
    <main className="min-h-screen bg-field text-ink">
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Distributed Collaboration Platform</h1>
            <p className="mt-1 text-sm text-slate-600">Real-time workspace synchronization over WebSockets and Redis Pub/Sub.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Circle className={collaboration.status === "connected" ? "h-3 w-3 fill-signal text-signal" : "h-3 w-3 fill-coral text-coral"} />
            <span className="font-medium capitalize">{collaboration.status}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 lg:grid-cols-[320px_1fr_340px]">
        <aside className="rounded border border-line bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-500">Connection</h2>
          <label className="mt-4 block text-sm font-medium">JWT token</label>
          <textarea
            className="mt-2 h-28 w-full resize-none rounded border border-line px-3 py-2 text-sm outline-none focus:border-signal"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste token from /auth/login"
          />
          <label className="mt-4 block text-sm font-medium">Workspace ID</label>
          <input
            className="mt-2 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-signal"
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
            placeholder="UUID"
          />
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <Metric label="Version" value={latestVersion.toString()} />
            <Metric label="Events" value={collaboration.events.length.toString()} />
          </div>
        </aside>

        <section className="rounded border border-line bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Shared Document</h2>
            <button
              className="inline-flex h-9 items-center gap-2 rounded bg-signal px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={collaboration.status !== "connected"}
              onClick={() => collaboration.sendPatch(draft)}
              title="Broadcast document update"
            >
              <Send className="h-4 w-4" />
              Sync
            </button>
          </div>
          <textarea
            className="mt-4 min-h-[420px] w-full resize-none rounded border border-line bg-slate-50 p-4 font-mono text-sm leading-6 outline-none focus:border-signal"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              collaboration.sendCursor(event.target.selectionStart, 0);
            }}
          />
        </section>

        <aside className="space-y-4">
          <Panel title="Presence" icon={<Users className="h-4 w-4" />}>
            {collaboration.presence.length === 0 ? (
              <p className="text-sm text-slate-500">No active collaborators yet.</p>
            ) : (
              <ul className="space-y-2">
                {collaboration.presence.map((user) => (
                  <li className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm" key={user.id}>
                    <span>{user.name}</span>
                    <span className="h-2 w-2 rounded-full bg-signal" />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Activity" icon={<Activity className="h-4 w-4" />}>
            <ol className="max-h-[360px] space-y-2 overflow-auto">
              {collaboration.events.slice().reverse().map((event) => (
                <li className="rounded border border-line px-3 py-2 text-xs" key={event.id}>
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{event.eventType}</span>
                    <span>v{event.version}</span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-slate-600">{JSON.stringify(event.payload, null, 2)}</pre>
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-slate-50 p-3">
      <div className="text-xs uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded border border-line bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
