'use client';

import type { ReactNode } from 'react';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import {
    FaceCirclePhoto,
    formatArrivalTime,
} from '@/components/arrivals/ArrivalCard';

function MetaChip(props: { emoji: string; children: ReactNode }) {
    return (
        <div className="rounded-full border border-white/15 bg-black/35 px-3 py-2 text-xs text-white/88 md:text-sm">
            <span className="mr-2 opacity-80">{props.emoji}</span>
            {props.children}
        </div>
    );
}

export function SpotlightCard(props: { event: ArrivalSseArrivalPayload }) {
    const { event: e } = props;
    const timeLabel = formatArrivalTime(e.eventDate);

    return (
        <article className="animate-in fade-in slide-in-from-bottom-4 mx-auto flex w-full max-w-3xl flex-col items-center duration-700">
            <div className="relative flex w-full flex-col rounded-3xl border border-teal-500/25 bg-gradient-to-b from-teal-950/40 via-slate-900/85 to-black/80 p-8 shadow-[0_40px_100px_-20px_rgba(20,184,166,0.25)] backdrop-blur-sm md:flex-row md:items-start md:gap-10 md:p-12">
                <div className="mx-auto shrink-0 md:mx-0">
                    <div className="rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 p-[3px] shadow-lg ring-4 ring-teal-500/40">
                        <div className="size-40 overflow-hidden rounded-full bg-slate-900 md:size-52">
                            <FaceCirclePhoto
                                className="size-full"
                                photoUrl={e.personPhotoUrl}
                                nameHint={e.personName}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-1 flex-col md:mt-0">
                    <p className="text-center text-xs font-medium uppercase tracking-widest text-teal-400/95 md:text-left">
                        {e.kind === 'responsible'
                            ? 'Responsável chegou'
                            : 'Chegada registrada'}
                    </p>
                    <h1 className="mt-3 text-center text-3xl font-bold leading-tight md:text-left md:text-5xl md:leading-none">
                        {e.personName?.trim() || 'Nome não disponível'}
                    </h1>

                    <dl className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                        <MetaChip emoji="📍">{e.readerName}</MetaChip>
                        <MetaChip emoji="🕐">{timeLabel}</MetaChip>
                    </dl>

                    {e.kind === 'responsible' && e.students.length > 0 ? (
                        <div className="mt-10 rounded-2xl border border-white/10 bg-black/25 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-white/55">
                                Filhos
                            </p>
                            <ul className="mt-5 flex flex-wrap justify-center gap-6 md:justify-start">
                                {e.students.map((s, index) => (
                                    <li
                                        key={`${e.accessId}-st-${index}-${s.name}`}
                                        className="flex flex-col items-center gap-3"
                                    >
                                        <div className="size-14 overflow-hidden rounded-full bg-slate-800 ring-2 ring-teal-500/35">
                                            <FaceCirclePhoto
                                                className="size-full"
                                                photoUrl={s.photoUrl}
                                                nameHint={s.name}
                                            />
                                        </div>
                                        <span className="max-w-[140px] text-center text-sm font-medium leading-snug text-white/92">
                                            {s.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
