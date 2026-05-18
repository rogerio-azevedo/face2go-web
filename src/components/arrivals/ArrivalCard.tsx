'use client';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';

export function formatArrivalTime(eventDateIso: string | null): string {
    if (eventDateIso == null) return '—';
    try {
        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(new Date(eventDateIso));
    } catch {
        return '—';
    }
}

type FacePhotoProps = {
    photoUrl: string | null;
    nameHint: string | null;
    className?: string;
};

/** Foto pré-assinada (R2) — usa `<img>` (URLs variadas); não usar next/image aqui. */
export function FaceCirclePhoto(props: FacePhotoProps) {
    const initial =
        props.nameHint?.trim()?.charAt(0)?.toUpperCase() ?? '?';
    return (
        <div className={props.className}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {props.photoUrl ? (
                <img
                    alt=""
                    src={props.photoUrl}
                    className="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <span className="flex size-full items-center justify-center font-bold uppercase text-teal-100">
                    {initial}
                </span>
            )}
        </div>
    );
}

export function ArrivalCardMini(props: { event: ArrivalSseArrivalPayload }) {
    const { event: e } = props;
    const t = formatArrivalTime(e.eventDate);

    return (
        <li className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-full bg-slate-800">
                <FaceCirclePhoto
                    className="size-full"
                    photoUrl={e.personPhotoUrl}
                    nameHint={e.personName}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                    {e.personName?.trim() || 'Sem nome'}
                </p>
                <p className="truncate text-xs text-white/50">{e.readerName}</p>
                <p className="mt-0.5 text-xs text-teal-300/90">{t}</p>
                {e.students.length ? (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-white/43">
                        {e.students.map((s) => s.name).join(' · ')}
                    </p>
                ) : null}
            </div>
        </li>
    );
}
