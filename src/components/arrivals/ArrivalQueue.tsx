'use client';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import { ArrivalCardGrid } from '@/components/arrivals/ArrivalCard';
import { MAX_ARRIVALS } from '@/hooks/use-arrival-stream';

export function ArrivalGrid(props: {
    items: ArrivalSseArrivalPayload[];
    highlightedIds: Set<string>;
}) {
    const { items, highlightedIds } = props;

    if (items.length === 0) {
        return (
            <p className="text-sm text-slate-400">
                Nenhum registro na lista — apenas a última chegada está no banner
                acima.
            </p>
        );
    }

    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e, index) => (
                <li key={`${e.accessId}-${e.eventDate}-${index}`}>
                    <ArrivalCardGrid
                        event={e}
                        isNew={highlightedIds.has(e.accessId)}
                    />
                </li>
            ))}
        </ul>
    );
}

export function ArrivalGridPanel(props: {
    queue: ArrivalSseArrivalPayload[];
    highlightedIds: Set<string>;
}) {
    const count = props.queue.length;

    return (
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
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
                />
            </div>
        </div>
    );
}
