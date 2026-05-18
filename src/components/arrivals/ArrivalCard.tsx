'use client';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import { cn } from '@/lib/utils';

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
                <span className="flex size-full items-center justify-center font-bold uppercase text-teal-600">
                    {initial}
                </span>
            )}
        </div>
    );
}

/** Cartão para grade — responsável visível à distância e filhos com foto + nome destacados. */
export function ArrivalCardGrid(props: {
    event: ArrivalSseArrivalPayload;
    isNew: boolean;
}) {
    const { event: e, isNew } = props;
    const t = formatArrivalTime(e.eventDate);

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm transition-shadow md:gap-3.5 md:p-4',
                isNew
                    ? 'border-teal-400 ring-2 ring-teal-500 ring-offset-2 ring-offset-white animate-pulse'
                    : 'border-slate-100',
            )}
        >
            <div className="flex gap-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-200 md:size-[4.25rem]">
                    <FaceCirclePhoto
                        className="size-full"
                        photoUrl={e.personPhotoUrl}
                        nameHint={e.personName}
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-lg font-bold leading-snug text-slate-900">
                        {e.personName?.trim() || 'Sem nome'}
                    </p>
                    <p className="truncate text-xs text-slate-500 md:text-sm">
                        {e.readerName}
                    </p>
                    <p className="mt-1 font-semibold tabular-nums text-base text-teal-600 md:text-lg">
                        {t}
                    </p>
                </div>
            </div>

            {e.students.length > 0 ? (
                <div className="border-t border-slate-100 pt-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-teal-700">
                        Filhos
                    </p>
                    <ul className="grid grid-cols-2 gap-x-2 gap-y-2 md:gap-x-3 md:gap-y-2.5">
                        {e.students.map((s, index) => (
                            <li
                                key={`${e.accessId}-st-${index}-${s.name}`}
                                className="flex min-w-0 items-center gap-2"
                            >
                                <div className="size-10 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-teal-100 md:size-11">
                                    <FaceCirclePhoto
                                        className="size-full"
                                        photoUrl={s.photoUrl}
                                        nameHint={s.name}
                                    />
                                </div>
                                <span className="min-w-0 flex-1 text-xs font-semibold leading-snug text-slate-800 line-clamp-2 md:text-sm">
                                    {s.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

export function ArrivalCardMini(props: { event: ArrivalSseArrivalPayload }) {
    const { event: e } = props;
    const t = formatArrivalTime(e.eventDate);

    return (
        <li className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-full bg-slate-200">
                <FaceCirclePhoto
                    className="size-full"
                    photoUrl={e.personPhotoUrl}
                    nameHint={e.personName}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">
                    {e.personName?.trim() || 'Sem nome'}
                </p>
                <p className="truncate text-xs text-slate-500">{e.readerName}</p>
                <p className="mt-0.5 text-xs text-teal-600">{t}</p>
                {e.students.length ? (
                    <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-400">
                        {e.students.map((s) => s.name).join(' · ')}
                    </p>
                ) : null}
            </div>
        </li>
    );
}
