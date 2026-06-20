"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-fetch";
import type {
    PanicEventItem,
    PanicPresencePayload,
    PanicUpdatedSocketPayload,
} from "@/types/panic-events";

function buildSocketUrl(): string {
    return getApiBaseUrl();
}

function upsertEvent(
    list: PanicEventItem[],
    event: PanicEventItem,
): PanicEventItem[] {
    const idx = list.findIndex((e) => e.id === event.id);
    if (idx === -1) return [event, ...list];
    const next = [...list];
    next[idx] = event;
    return next;
}

export function useMonitoringSocket(accessToken: string | undefined) {
    const [connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(
        null,
    );
    const [onlineCount, setOnlineCount] = useState(0);
    const [events, setEvents] = useState<PanicEventItem[]>([]);
    const socketRef = useRef<Socket | null>(null);

    const upsert = useCallback((event: PanicEventItem) => {
        setEvents((prev) => {
            if (event.status === "closed") {
                return prev.filter((item) => item.id !== event.id);
            }
            return upsertEvent(prev, event);
        });
    }, []);

    useEffect(() => {
        if (!accessToken) return;

        const socket = io(`${buildSocketUrl()}/monitoring`, {
            auth: { token: accessToken },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 3000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            setConnectionError(null);
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        socket.on("connect_error", () => {
            setConnected(false);
            setConnectionError("Falha ao conectar ao monitoramento em tempo real.");
        });

        socket.on("panic:new", (event: PanicEventItem) => {
            upsert(event);
        });

        socket.on("panic:updated", (payload: PanicUpdatedSocketPayload) => {
            upsert(payload.event);
        });

        socket.on("panic:operators-presence", (payload: PanicPresencePayload) => {
            setOnlineCount(payload.onlineCount);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [accessToken, upsert]);

    const replaceEvents = useCallback((list: PanicEventItem[]) => {
        setEvents(list);
    }, []);

    return {
        connected,
        connectionError,
        onlineCount,
        events,
        replaceEvents,
        upsertEvent: upsert,
    };
}
