"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/api-fetch";

export type BlockedAttemptSocketPayload = {
    accessId: string;
    faceId: number;
    clientId: string;
    clientName: string;
    companyId: string;
    personName: string | null;
    personId: string | null;
    personType: string | null;
    blockReason: string | null;
    readerId: string;
    readerName: string;
    readerDirection: "in" | "out" | null;
    eventDate: string | Date | null;
    snapR2Key: string | null;
    snapUrl?: string | null;
};

export function useBlockedAttemptSocket(
    accessToken: string | undefined,
    onAttempt: (event: BlockedAttemptSocketPayload) => void,
) {
    const onAttemptRef = useRef(onAttempt);

    useEffect(() => {
        onAttemptRef.current = onAttempt;
    }, [onAttempt]);

    useEffect(() => {
        if (!accessToken) return;

        const socket: Socket = io(`${getApiBaseUrl()}/monitoring`, {
            auth: { token: accessToken },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 3000,
        });

        socket.on(
            "access:blocked-attempt",
            (payload: BlockedAttemptSocketPayload) => {
                onAttemptRef.current(payload);
            },
        );

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [accessToken]);
}
