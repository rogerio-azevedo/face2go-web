'use client';

import { LayoutGrid, LayoutList, Wifi, WifiOff } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';

import type {
    ArrivalLayout,
    ArrivalSseArrivalPayload,
} from '@/components/arrivals/arrival-types';
import { ArrivalGridPanel } from '@/components/arrivals/ArrivalQueue';
import { DisplayClock } from '@/components/arrivals/DisplayClock';
import { LastArrivalBanner } from '@/components/arrivals/LastArrivalBanner';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    DEFAULT_RECONNECT_DELAY_MS,
    useArrivalStream,
} from '@/hooks/use-arrival-stream';

const ARRIVAL_NEW_HIGHLIGHT_MS = 8000;
const ARRIVAL_LAYOUT_STORAGE_KEY = 'arrivals-layout';

function parseStoredLayout(raw: string | null): ArrivalLayout | null {
    if (raw === 'vertical' || raw === 'horizontal') return raw;
    return null;
}

function useArrivalLayoutPreference(): [
    ArrivalLayout,
    Dispatch<SetStateAction<ArrivalLayout>>,
] {
    const [layout, setLayout] = useState<ArrivalLayout>('horizontal');
    const skipPersistRef = useRef(true);

    useEffect(() => {
        try {
            const stored = parseStoredLayout(
                localStorage.getItem(ARRIVAL_LAYOUT_STORAGE_KEY),
            );
            if (stored) setLayout(stored);
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        if (skipPersistRef.current) {
            skipPersistRef.current = false;
            return;
        }
        try {
            localStorage.setItem(ARRIVAL_LAYOUT_STORAGE_KEY, layout);
        } catch {
            /* ignore */
        }
    }, [layout]);

    return [layout, setLayout];
}

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

    const [layout, setLayout] = useArrivalLayoutPreference();
    const toggleLayout = useCallback(() => {
        setLayout((l) => (l === 'horizontal' ? 'vertical' : 'horizontal'));
    }, [setLayout]);

    const highlightedIds = useNewArrivalHighlights(arrivals);
    const last: ArrivalSseArrivalPayload | null = arrivals[0] ?? null;
    const queue = arrivals.slice(1);
    const vertical = layout === 'vertical';

    useEffect(() => {
        document.title = 'Face2GO — Display de chegada';
    }, []);

    const contentGutterClass = vertical
        ? 'mx-2 md:mx-3'
        : 'mx-3 md:mx-6';

    return (
        <div className="relative flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/40 text-slate-900">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100/40 via-transparent to-transparent" />

            <header
                className={cn(
                    'relative z-10 flex shrink-0 flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between md:gap-4 md:py-5',
                    vertical ? 'px-2 md:px-3' : 'px-3 md:px-6',
                )}
            >
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                        Face2GO
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-800 md:text-2xl">
                        Chegada na escola
                    </p>
                </div>
                <DisplayClock className="shrink-0 md:order-last" />

                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 border-slate-200 bg-white shadow-sm"
                                    onClick={toggleLayout}
                                    aria-label={
                                        layout === 'horizontal'
                                            ? 'Ativar modo vertical'
                                            : 'Ativar modo horizontal'
                                    }
                                >
                                    {layout === 'horizontal' ? (
                                        <LayoutList
                                            className="size-4"
                                            aria-hidden
                                        />
                                    ) : (
                                        <LayoutGrid
                                            className="size-4"
                                            aria-hidden
                                        />
                                    )}
                                </Button>
                            }
                        />
                        <TooltipContent side="bottom">
                            {layout === 'horizontal'
                                ? 'Modo vertical'
                                : 'Modo horizontal'}
                        </TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-sm md:text-sm">
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
                </div>
            </header>

            {last ? (
                <>
                    <LastArrivalBanner event={last} layout={layout} />
                    <main
                        className={cn(
                            'relative z-10 mb-6 flex min-h-0 flex-1 flex-col md:mb-8',
                            contentGutterClass,
                        )}
                    >
                        <ArrivalGridPanel
                            highlightedIds={highlightedIds}
                            layout={layout}
                            queue={queue}
                        />
                    </main>
                </>
            ) : (
                <main
                    className={cn(
                        'relative z-10 flex flex-1 flex-col items-center justify-center pb-8 md:px-10',
                        vertical ? 'px-3 md:px-4' : 'px-5',
                    )}
                >
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
