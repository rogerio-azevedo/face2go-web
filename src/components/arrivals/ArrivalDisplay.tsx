'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import { ArrivalGridPanel } from '@/components/arrivals/ArrivalQueue';
import { DisplayClock } from '@/components/arrivals/DisplayClock';
import { LastArrivalBanner } from '@/components/arrivals/LastArrivalBanner';
import {
    DEFAULT_RECONNECT_DELAY_MS,
    useArrivalStream,
} from '@/hooks/use-arrival-stream';

const ARRIVAL_NEW_HIGHLIGHT_MS = 8000;

function useNewArrivalHighlights(arrivals: ArrivalSseArrivalPayload[]) {
    const [highlightedIds, setHighlightedIds] = useState(() => new Set<string>());
    const prevIdsRef = useRef<Set<string>>(new Set());
    const timeoutMapRef = useRef(
        new Map<string, ReturnType<typeof setTimeout>>(),
    );

    useEffect(() => {
        const prev = prevIdsRef.current;
        for (const a of arrivals) {
            if (!prev.has(a.accessId)) {
                setHighlightedIds((s) => new Set(s).add(a.accessId));
                const id = a.accessId;
                const existing = timeoutMapRef.current.get(id);
                if (existing) clearTimeout(existing);
                const t = setTimeout(() => {
                    timeoutMapRef.current.delete(id);
                    setHighlightedIds((s) => {
                        const n = new Set(s);
                        n.delete(id);
                        return n;
                    });
                }, ARRIVAL_NEW_HIGHLIGHT_MS);
                timeoutMapRef.current.set(id, t);
            }
        }
        prevIdsRef.current = new Set(arrivals.map((x) => x.accessId));
    }, [arrivals]);

    useEffect(() => {
        return () => {
            for (const t of timeoutMapRef.current.values()) clearTimeout(t);
            timeoutMapRef.current.clear();
        };
    }, []);

    return highlightedIds;
}

export function ArrivalDisplay(props: {
    clientId: string;
    token: string;
}) {
    const { clientId, token } = props;
    const { connected, arrivals, connectionError } = useArrivalStream({
        clientId,
        token,
    });

    const highlightedIds = useNewArrivalHighlights(arrivals);
    const last: ArrivalSseArrivalPayload | null = arrivals[0] ?? null;
    const queue = arrivals.slice(1);

    useEffect(() => {
        document.title = 'Face2GO — Display de chegada';
    }, []);

    return (
        <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/40 text-slate-900">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100/40 via-transparent to-transparent" />

            <header className="relative z-10 flex shrink-0 flex-col gap-4 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-10 md:py-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                        Face2GO
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-800 md:text-2xl">
                        Chegada na escola
                    </p>
                </div>
                <DisplayClock className="shrink-0 md:order-last" />

                <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm md:self-auto md:text-sm">
                    {connected ? (
                        <>
                            <span className="relative flex size-2.5 shrink-0">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-500 opacity-55" />
                                <span className="relative inline-flex size-2.5 rounded-full bg-teal-500" />
                            </span>
                            <Wifi className="size-4 text-teal-600" aria-hidden />
                            <span className="text-teal-700">
                                Ao vivo · conectado
                            </span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="size-4 text-rose-500" aria-hidden />
                            <span className="max-w-[min(100%,18rem)] text-rose-600">
                                {connectionError ??
                                    `Reconectando (${DEFAULT_RECONNECT_DELAY_MS / 1000}s)…`}
                            </span>
                        </>
                    )}
                </div>
            </header>

            {last ? (
                <>
                    <LastArrivalBanner event={last} />
                    <main className="relative z-10 mx-5 mb-6 flex min-h-0 flex-1 flex-col md:mx-10 md:mb-8">
                        <ArrivalGridPanel
                            highlightedIds={highlightedIds}
                            queue={queue}
                        />
                    </main>
                </>
            ) : (
                <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-8 md:px-10">
                    <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 px-10 py-16 text-center">
                        <p className="text-lg font-semibold text-slate-700 md:text-xl">
                            Aguardando chegadas…
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                            Os reconhecimentos aparecerão aqui com destaque na última
                            chegada e lista completa abaixo.
                        </p>
                    </div>
                </main>
            )}
        </div>
    );
}
