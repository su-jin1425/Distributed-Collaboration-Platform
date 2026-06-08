"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CollaborationEvent, PresenceUser } from "../types/collaboration";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8001";

interface UseCollaborationSocketInput {
  token: string;
  workspaceId: string;
  enabled: boolean;
}

export function useCollaborationSocket(input: UseCollaborationSocketInput) {
  const socketRef = useRef<WebSocket | null>(null);
  const [events, setEvents] = useState<CollaborationEvent[]>([]);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "closed">("idle");

  useEffect(() => {
    if (!input.enabled || !input.token || !input.workspaceId) {
      return;
    }

    setStatus("connecting");
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("connected");
      socket.send(JSON.stringify({ type: "join_workspace", workspaceId: input.workspaceId, token: input.token }));
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === "event_broadcast") {
        setEvents((current) => [...current.slice(-99), data.event]);
      }
      if (data.type === "user_joined") {
        setPresence((current) => {
          if (current.some((user) => user.id === data.user.id)) return current;
          return [...current, data.user];
        });
      }
      if (data.type === "user_left") {
        setPresence((current) => current.filter((user) => user.id !== data.user.id));
      }
    };

    socket.onclose = () => setStatus("closed");

    return () => {
      socket.send(JSON.stringify({ type: "leave_workspace", workspaceId: input.workspaceId }));
      socket.close();
    };
  }, [input.enabled, input.token, input.workspaceId]);

  const actions = useMemo(
    () => ({
      sendPatch(text: string) {
        socketRef.current?.send(
          JSON.stringify({
            type: "collaboration_update",
            workspaceId: input.workspaceId,
            payload: { text },
            clientSentAt: Date.now()
          })
        );
      },
      sendCursor(line: number, column: number) {
        socketRef.current?.send(
          JSON.stringify({
            type: "cursor_update",
            workspaceId: input.workspaceId,
            payload: { line, column },
            clientSentAt: Date.now()
          })
        );
      }
    }),
    [input.workspaceId]
  );

  return { events, presence, status, ...actions };
}
