"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-fetch";

export type ReaderOfflineSocketPayload = {
    readerId: string;
    readerName: string;
    clientId: string;
    clientName: string;
    companyId: string;
    brand: string;
    lastConnectionError?: string;
    detectedAt: string | Date;
};

export function useReaderOfflineSocket(
    accessToken: string | undefined,
    onOffline: (event: ReaderOfflineSocketPayload) => void,
) {
    const onOfflineRef = useRef(onOffline);

    useEffect(() => {
        onOfflineRef.current = onOffline;
    }, [onOffline]);

    useEffect(() => {
        if (!accessToken) return;

        const socket: Socket = io(`${getApiBaseUrl()}/monitoring`, {
            auth: { token: accessToken },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 3000,
        });

        socket.on("reader:offline", (payload: ReaderOfflineSocketPayload) => {
            onOfflineRef.current(payload);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [accessToken]);
}
