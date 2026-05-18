'use client';

import type {
    ArrivalLayout,
    ArrivalSseArrivalPayload,
} from '@/components/arrivals/arrival-types';
import {
    FaceCirclePhoto,
    formatArrivalTime,
} from '@/components/arrivals/ArrivalCard';
import { cn } from '@/lib/utils';

export function LastArrivalBanner(props: {
    event: ArrivalSseArrivalPayload;
    layout: ArrivalLayout;
}) {
    const { event: e, layout } = props;
    const timeLabel = formatArrivalTime(e.eventDate);
    const label =
        e.kind === 'responsible' ? 'Último — responsável' : 'Última chegada';
    const vertical = layout === 'vertical';

    return (
        <div
            className={cn(
                'relative z-10 mb-4 flex shrink-0 flex-col gap-3 rounded-2xl border border-teal-200 bg-gradient-to-r from-white to-teal-50/80 shadow-sm',
                vertical
                    ? 'mx-3 px-4 py-3 md:mx-4 md:px-5 md:py-4'
                    : 'mx-6 min-h-[5rem] px-4 py-2.5 md:mx-10 md:flex-row md:items-center md:gap-6 md:px-5',
            )}
        >
            <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 p-0.5 shadow ring-2 ring-teal-200">
                    <div
                        className={cn(
                            'overflow-hidden rounded-full bg-slate-100',
                            vertical ? 'size-16 md:size-20' : 'size-11 md:size-12',
                        )}
                    >
                        <FaceCirclePhoto
                            className="size-full"
                            photoUrl={e.personPhotoUrl}
                            nameHint={e.personName}
                        />
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'font-semibold uppercase tracking-wider text-teal-600',
                            vertical ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs',
                        )}
                    >
                        {label}
                    </p>
                    <p
                        className={cn(
                            'truncate font-bold leading-tight text-slate-900',
                            vertical ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl',
                        )}
                    >
                        {e.personName?.trim() || 'Nome não disponível'}
                    </p>

                    {e.kind === 'responsible' && e.students.length > 0 ? (
                        <div className="mt-2">
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Alunos
                            </p>
                            <ul
                                className={cn(
                                    'grid grid-cols-2 gap-x-2 gap-y-2',
                                    vertical ? 'md:gap-x-4 md:gap-y-3' : 'md:gap-x-3',
                                )}
                            >
                                {e.students.map((s, index) => (
                                    <li
                                        key={`${e.accessId}-bn-st-${index}-${s.name}`}
                                        className="flex min-w-0 items-center gap-2 md:gap-3"
                                    >
                                        <div
                                            className={cn(
                                                'shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-teal-100',
                                                vertical
                                                    ? 'size-16 md:size-20'
                                                    : 'size-11 md:size-12',
                                            )}
                                        >
                                            <FaceCirclePhoto
                                                className="size-full"
                                                photoUrl={s.photoUrl}
                                                nameHint={s.name}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span
                                                className={cn(
                                                    'block font-semibold leading-snug text-slate-800 line-clamp-2',
                                                    vertical
                                                        ? 'text-sm md:text-base'
                                                        : 'text-xs md:text-sm',
                                                )}
                                            >
                                                {s.name}
                                            </span>
                                            {s.className ? (
                                                <span className="mt-0.5 block line-clamp-2 text-[10px] leading-snug text-slate-400 md:text-[11px]">
                                                    {s.className}
                                                </span>
                                            ) : null}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </div>

            <div
                className={cn(
                    'flex shrink-0 flex-col gap-0.5 border-t border-teal-100 pt-2.5',
                    vertical
                        ? 'items-center text-center'
                        : 'items-start md:flex md:items-end md:border-l md:border-teal-100 md:pl-5 md:pt-0 md:text-right',
                )}
            >
                <p
                    className={cn(
                        'truncate text-slate-500',
                        vertical
                            ? 'max-w-full text-xs md:text-sm'
                            : 'max-w-[12rem] text-[11px] md:ml-auto md:max-w-[10rem] md:text-xs',
                    )}
                >
                    📍 {e.readerName}
                </p>
                {e.vehiclePlate ? (
                    <p
                        className={cn(
                            'truncate font-semibold tabular-nums tracking-wide text-slate-700',
                            vertical
                                ? 'max-w-full text-sm md:text-base'
                                : 'max-w-[12rem] text-xs md:ml-auto md:max-w-[10rem] md:text-sm',
                        )}
                    >
                        🚗 {e.vehiclePlate}
                    </p>
                ) : null}
                <p
                    className={cn(
                        'font-semibold tabular-nums text-teal-700',
                        vertical ? 'text-xl md:text-2xl' : 'text-base md:ml-auto md:text-lg',
                    )}
                >
                    {timeLabel}
                </p>
            </div>
        </div>
    );
}
