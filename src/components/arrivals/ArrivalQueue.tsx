'use client';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import { ArrivalCardMini } from '@/components/arrivals/ArrivalCard';
import { MAX_ARRIVALS } from '@/hooks/use-arrival-stream';

export function ArrivalQueue(props: {
    items: ArrivalSseArrivalPayload[];
    className?: string;
}) {
    if (props.items.length === 0) {
        return (
            <p className={`text-sm text-white/48 ${props.className ?? ''}`}>
                Ninguém na fila — os registros mais antigos aparecem aqui.
            </p>
        );
    }

    return (
        <ul className={`flex flex-col gap-4 pr-2 ${props.className ?? ''}`}>
            {props.items.map((e, index) => (
                <ArrivalCardMini key={`${e.accessId}-${e.eventDate}-${index}`} event={e} />
            ))}
        </ul>
    );
}

export function QueuePanel(props: { queue: ArrivalSseArrivalPayload[] }) {
    return (
        <div className="flex h-full min-h-[12rem] flex-col rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-md md:max-h-[min(70vh,calc(100vh-14rem))]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/65">
                Fila recente
            </h2>
            <p className="text-xs text-white/45">
                Até {MAX_ARRIVALS} chegadas
            </p>
            <ArrivalQueue className="mt-4 overflow-y-auto" items={props.queue} />
        </div>
    );
}
