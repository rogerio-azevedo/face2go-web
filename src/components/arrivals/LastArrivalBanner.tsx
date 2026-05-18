'use client';

import type { ArrivalSseArrivalPayload } from '@/components/arrivals/arrival-types';
import {
    FaceCirclePhoto,
    formatArrivalTime,
} from '@/components/arrivals/ArrivalCard';

export function LastArrivalBanner(props: { event: ArrivalSseArrivalPayload }) {
    const { event: e } = props;
    const timeLabel = formatArrivalTime(e.eventDate);
    const label =
        e.kind === 'responsible' ? 'Último — responsável' : 'Última chegada';

    return (
        <div className="relative z-10 mx-6 mb-4 flex shrink-0 flex-col gap-3 rounded-2xl border border-teal-200 bg-gradient-to-r from-white to-teal-50/80 px-4 py-3 shadow-sm min-h-[5rem] md:mx-10 md:flex-row md:items-center md:gap-6 md:px-6">
            <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 p-0.5 shadow ring-2 ring-teal-200">
                    <div className="size-11 overflow-hidden rounded-full bg-slate-100 md:size-12">
                        <FaceCirclePhoto
                            className="size-full"
                            photoUrl={e.personPhotoUrl}
                            nameHint={e.personName}
                        />
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 md:text-xs">
                        {label}
                    </p>
                    <p className="truncate text-lg font-bold leading-tight text-slate-900 md:text-xl">
                        {e.personName?.trim() || 'Nome não disponível'}
                    </p>

                    {e.kind === 'responsible' && e.students.length > 0 ? (
                        <div className="mt-2">
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Filhos
                            </p>
                            <ul className="grid grid-cols-2 gap-x-2 gap-y-2 md:gap-x-3">
                                {e.students.map((s, index) => (
                                    <li
                                        key={`${e.accessId}-bn-st-${index}-${s.name}`}
                                        className="flex min-w-0 items-center gap-2"
                                    >
                                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-teal-100 md:size-9">
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
            </div>

            <div className="flex shrink-0 flex-col items-start gap-0.5 border-t border-teal-100 pt-3 md:flex md:items-end md:border-l md:border-teal-100 md:pl-6 md:pt-0 md:text-right">
                <p className="max-w-[12rem] truncate text-[11px] text-slate-500 md:ml-auto md:max-w-[10rem] md:text-xs">
                    📍 {e.readerName}
                </p>
                <p className="font-semibold tabular-nums text-base text-teal-700 md:ml-auto md:text-lg">
                    {timeLabel}
                </p>
            </div>
        </div>
    );
}
