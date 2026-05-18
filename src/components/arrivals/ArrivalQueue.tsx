'use client';

import type {
    ArrivalLayout,
    ArrivalSseArrivalPayload,
} from '@/components/arrivals/arrival-types';
import { ArrivalCardGrid } from '@/components/arrivals/ArrivalCard';
import { MAX_ARRIVALS } from '@/hooks/use-arrival-stream';
import { cn } from '@/lib/utils';

export function ArrivalGrid(props: {
    items: ArrivalSseArrivalPayload[];
    highlightedIds: Set<string>;
    layout: ArrivalLayout;
}) {
    const { items, highlightedIds, layout } = props;

    if (items.length === 0) {
        return (
            <p className="text-sm text-slate-400">
                Nenhum registro na lista — apenas a última chegada está no banner
                acima.
            </p>
        );
    }

    return (
        <ul
            className={cn(
                'grid gap-3',
                layout === 'vertical'
                    ? 'grid-cols-1'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            )}
        >
            {items.map((e, index) => (
                <li
                    key={`${e.accessId}-${e.eventDate}-${index}`}
                    className="h-full min-h-0"
                >
                    <ArrivalCardGrid
                        event={e}
                        isNew={highlightedIds.has(e.accessId)}
                        layout={layout}
                        position={index + 2}
                    />
                </li>
            ))}
        </ul>
    );
}

export function ArrivalGridPanel(props: {
    queue: ArrivalSseArrivalPayload[];
    highlightedIds: Set<string>;
    layout: ArrivalLayout;
}) {
    const count = props.queue.length;

    return (
        <div
            className={cn(
                'flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm',
                props.layout === 'vertical'
                    ? 'p-2.5 md:p-3'
                    : 'p-3 md:p-4',
            )}
        >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Fila de chegadas
            </h2>
            <p className="text-xs text-slate-400">
                {count} registro{count === 1 ? '' : 's'} · até {MAX_ARRIVALS}{' '}
                mais recentes
            </p>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                <ArrivalGrid
                    highlightedIds={props.highlightedIds}
                    items={props.queue}
                    layout={props.layout}
                />
            </div>
        </div>
    );
}
