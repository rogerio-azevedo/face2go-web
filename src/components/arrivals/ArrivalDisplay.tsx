'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useEffect } from 'react';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import { QueuePanel } from '@/components/arrivals/ArrivalQueue';
import { DisplayClock } from '@/components/arrivals/DisplayClock';
import { SpotlightCard } from '@/components/arrivals/SpotlightCard';
import {
    DEFAULT_RECONNECT_DELAY_MS,
    useArrivalStream,
} from '@/hooks/use-arrival-stream';

export function ArrivalDisplay(props: {
    clientId: string;
    token: string;
}) {
    const { clientId, token } = props;
    const { connected, arrivals, connectionError } = useArrivalStream({
        clientId,
        token,
    });

    const spotlight: ArrivalSseArrivalPayload | null = arrivals[0] ?? null;
    const queue = arrivals.slice(1);

    useEffect(() => {
        document.title = 'Face2GO — Display de chegada';
    }, []);

    return (
        <div className="relative min-h-[100svh] overflow-hidden bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/25 via-transparent to-transparent" />

            <header className="relative z-10 flex flex-col gap-6 px-6 py-6 md:flex-row md:items-start md:justify-between md:px-10 md:py-8">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400/90">
                        Face2GO
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white/95 md:text-2xl">
                        Chegada na escola
                    </p>
                </div>
                <DisplayClock className="shrink-0 md:order-last" />

                <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs font-medium backdrop-blur-sm md:self-auto md:text-sm">
                    {connected ? (
                        <>
                            <span className="relative flex size-2.5 shrink-0">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-65" />
                                <span className="relative inline-flex size-2.5 rounded-full bg-teal-400" />
                            </span>
                            <Wifi className="size-4 text-teal-300" aria-hidden />
                            <span className="text-teal-100/90">
                                Ao vivo · conectado
                            </span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="size-4 text-rose-400" aria-hidden />
                            <span className="max-w-[min(100%,18rem)] text-rose-100/95">
                                {connectionError ??
                                    `Reconectando (${DEFAULT_RECONNECT_DELAY_MS / 1000}s)…`}
                            </span>
                        </>
                    )}
                </div>
            </header>

            <main className="relative z-10 flex min-h-[calc(100svh-8rem)] flex-col px-6 pb-8 md:flex-row md:gap-10 md:px-10">
                <section className="flex flex-1 flex-col justify-center pb-8 md:pb-0 md:pr-8">
                    {spotlight ? (
                        <SpotlightCard key={spotlight.accessId} event={spotlight} />
                    ) : (
                        <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-10 py-20 text-center">
                            <p className="text-lg font-semibold text-white/90 md:text-xl">
                                Aguardando chegadas…
                            </p>
                            <p className="mt-2 text-sm text-white/55">
                                O último reconhecimento facial aparecerá em destaque aqui.
                            </p>
                        </div>
                    )}
                </section>

                <aside className="shrink-0 md:w-[min(28rem,calc(100vw-14rem))]">
                    <QueuePanel queue={queue} />
                </aside>
            </main>
        </div>
    );
}
