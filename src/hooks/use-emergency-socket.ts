"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-fetch";
import type { EmergencyEventResponse, EmergencySummary } from "@/types/domain";

type EmergencyCheckinUpdatedPayload = {
    eventId: string;
    companyId: string;
    clientId: string;
    checkin: EmergencyEventResponse["checkins"][number];
    summary: EmergencySummary;
};

export function useEmergencySocket(
    accessToken: string | undefined,
    eventId: string,
    initialEvent: EmergencyEventResponse,
) {
    const [connected, setConnected] = useState(false);
    const [event, setEvent] = useState(initialEvent);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        setEvent(initialEvent);
    }, [initialEvent]);

    const applySnapshot = useCallback((snapshot: EmergencyEventResponse) => {
        setEvent(snapshot);
    }, []);

    useEffect(() => {
        if (!accessToken || !eventId) return;

        const socket = io(`${getApiBaseUrl()}/emergency`, {
            auth: { token: accessToken },
            query: { eventId },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 3000,
        });
        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        socket.on("emergency:snapshot", (payload: EmergencyEventResponse) => {
            applySnapshot(payload);
        });

        socket.on(
            "emergency:checkin-updated",
            (payload: EmergencyCheckinUpdatedPayload) => {
                setEvent((prev) => {
                    const checkins = prev.checkins.map((item) =>
                        item.id === payload.checkin.id ? payload.checkin : item,
                    );
                    return {
                        ...prev,
                        checkins,
                        summary: payload.summary,
                    };
                });
            },
        );

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [accessToken, eventId, applySnapshot]);

    return { connected, event, applySnapshot };
}
