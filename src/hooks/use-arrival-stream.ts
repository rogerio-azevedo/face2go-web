'use client';

import { useEffect, useState } from 'react';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import { getApiBaseUrl } from '@/lib/api-fetch';

export const MAX_ARRIVALS = 20;
export const DEFAULT_RECONNECT_DELAY_MS = 3500;

function buildStreamUrl(clientId: string, token: string): string {
    const base = getApiBaseUrl();
    const q = new URLSearchParams({ token }).toString();
    return `${base}/api/clients/${encodeURIComponent(clientId)}/arrivals/stream?${q}`;
}

export function useArrivalStream(params: { clientId: string; token: string }) {
    const { clientId, token } = params;
    const [connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(
        null,
    );
    const [arrivals, setArrivals] = useState<ArrivalSseArrivalPayload[]>([]);

    useEffect(() => {
        let es: EventSource | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        let cancelled = false;

        const connect = () => {
            es?.close();
            setConnectionError(null);

            const scheduleReconnect = () => {
                clearTimeout(reconnectTimer);
                if (cancelled) return;
                reconnectTimer = setTimeout(() => {
                    if (!cancelled) connect();
                }, DEFAULT_RECONNECT_DELAY_MS);
            };

            try {
                es = new EventSource(buildStreamUrl(clientId, token));
            } catch {
                setConnected(false);
                setConnectionError('Não foi possível iniciar EventSource.');
                scheduleReconnect();
                return;
            }

            es.onopen = () => {
                if (cancelled) return;
                setConnected(true);
            };

            es.onmessage = (ev) => {
                if (cancelled) return;
                try {
                    const data = JSON.parse(ev.data as string) as {
                        type?: string;
                    };
                    if (data?.type === 'arrival') {
                        const evt = data as ArrivalSseArrivalPayload;
                        setArrivals((prev) => {
                            const next = [
                                evt,
                                ...prev.filter((p) => p.accessId !== evt.accessId),
                            ];
                            return next.slice(0, MAX_ARRIVALS);
                        });
                    }
                } catch {
                    /* ignore malformed */
                }
            };

            es.onerror = () => {
                if (cancelled) return;
                setConnected(false);
                es?.close();
                es = null;
                setConnectionError(
                    `Conexão perdida · tentando novamente (${DEFAULT_RECONNECT_DELAY_MS / 1000}s)…`,
                );
                scheduleReconnect();
            };
        };

        connect();

        return () => {
            cancelled = true;
            clearTimeout(reconnectTimer);
            es?.close();
        };
    }, [clientId, token]);

    return {
        connected,
        connectionError,
        arrivals,
    };
}
