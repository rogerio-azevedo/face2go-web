'use client';

import type {
    ArrivalLayout,
    ArrivalSseArrivalPayload,
} from '@/components/arrivals/arrival-types';
import {
    FaceCirclePhoto,
    formatArrivalTime,
    getCardScale,
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
    const scale = getCardScale(e.students.length);
    const studentCols =
        e.students.length > 4 ? 'grid-cols-3' : 'grid-cols-2';

    if (vertical) {
        return (
            <div
                className={cn(
                    'relative z-10 mb-4 flex shrink-0 flex-col gap-2.5 rounded-2xl border border-teal-200 bg-gradient-to-r from-white to-teal-50/80 shadow-sm',
                    'mx-2 px-2 py-2 md:mx-3 md:px-3 md:py-2.5',
                )}
            >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 p-0.5 shadow ring-2 ring-teal-200">
                        <div
                            className={cn(
                                'overflow-hidden rounded-full bg-slate-100',
                                scale.responsiblePhoto,
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
                                'text-xs md:text-sm',
                            )}
                        >
                            {label}
                        </p>
                        <p
                            className={cn(
                                'truncate font-bold leading-tight text-slate-900',
                                scale.responsibleName,
                            )}
                        >
                            {e.personName?.trim() || 'Nome não disponível'}
                        </p>

                        {e.kind === 'responsible' && e.students.length > 0 ? (
                            <div className="mt-1.5">
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    Alunos
                                </p>
                                <ul
                                    className={cn(
                                        'grid gap-x-1.5 gap-y-1',
                                        studentCols,
                                        'md:gap-x-2 md:gap-y-1.5',
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
                                                    scale.studentPhoto,
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
                                                        scale.studentName,
                                                    )}
                                                >
                                                    {s.name}
                                                </span>
                                                {s.className ? (
                                                    <span
                                                        className={cn(
                                                            'mt-1 block line-clamp-2 font-medium leading-snug text-slate-600',
                                                            scale.studentClass,
                                                        )}
                                                    >
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
                        'items-center text-center',
                    )}
                >
                    <p
                        className={cn(
                            'max-w-full truncate text-slate-500',
                            scale.reader,
                        )}
                    >
                        📍 {e.readerName}
                    </p>
                    {e.vehiclePlate ? (
                        <p className="max-w-full truncate text-sm font-semibold tabular-nums tracking-wide text-slate-700 md:text-base">
                            🚗 {e.vehiclePlate}
                        </p>
                    ) : null}
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-extrabold tabular-nums text-white shadow-md ring-2 ring-teal-100 md:size-9 md:text-sm"
                        aria-label="Posição 1 na fila — última chegada"
                    >
                        #1
                    </div>
                    <p
                        className={cn(
                            'font-semibold tabular-nums text-teal-700',
                            scale.time,
                        )}
                    >
                        {timeLabel}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative z-10 mb-4 flex shrink-0 flex-row gap-2 rounded-2xl border border-teal-200 bg-gradient-to-r from-white to-teal-50/80 shadow-sm',
                'mx-3 min-h-[6rem] px-2 py-2 md:mx-6 md:min-h-[6.5rem] md:gap-2.5 md:px-3 md:py-2.5',
            )}
        >
            {/* Coluna 1 (~20%) — responsável */}
            <div className="flex min-w-0 basis-1/5 flex-col items-center gap-1 text-center md:items-start md:text-left">
                <div className="shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 p-0.5 shadow ring-2 ring-teal-200">
                    <div
                        className={cn(
                            'overflow-hidden rounded-full bg-slate-100',
                            scale.responsiblePhoto,
                        )}
                    >
                        <FaceCirclePhoto
                            className="size-full"
                            photoUrl={e.personPhotoUrl}
                            nameHint={e.personName}
                        />
                    </div>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 md:text-xs">
                    {label}
                </p>
                <p
                    className={cn(
                        'line-clamp-3 max-w-full font-bold leading-tight text-slate-900',
                        scale.responsibleName,
                    )}
                >
                    {e.personName?.trim() || 'Nome não disponível'}
                </p>
                <p
                    className={cn(
                        'line-clamp-2 max-w-full text-slate-500',
                        scale.reader,
                    )}
                >
                    📍 {e.readerName}
                </p>
            </div>

            {/* Coluna 2 (~60%) — alunos */}
            <div
                className={cn(
                    'flex min-h-0 min-w-0 basis-3/5 flex-col border-x border-teal-100 px-1.5',
                    'md:px-2.5',
                )}
            >
                {e.kind === 'responsible' && e.students.length > 0 ? (
                    <>
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 md:mb-1 md:text-[11px]">
                            Alunos
                        </p>
                        <ul
                            className={cn(
                                'grid min-h-0 flex-1 gap-x-1.5 gap-y-1 overflow-y-auto',
                                studentCols,
                                'md:gap-x-2 md:gap-y-1',
                            )}
                        >
                            {e.students.map((s, index) => (
                                <li
                                    key={`${e.accessId}-bn-st-${index}-${s.name}`}
                                    className="flex min-w-0 items-center gap-1.5 md:gap-2"
                                >
                                    <div
                                        className={cn(
                                            'shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-teal-100',
                                            scale.studentPhoto,
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
                                                scale.studentName,
                                            )}
                                        >
                                            {s.name}
                                        </span>
                                        {s.className ? (
                                            <span
                                                className={cn(
                                                    'mt-0.5 block line-clamp-2 font-medium leading-snug text-slate-600',
                                                    scale.studentClass,
                                                )}
                                            >
                                                {s.className}
                                            </span>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="text-xs text-slate-400 md:text-sm">
                        Sem alunos neste registro.
                    </p>
                )}
            </div>

            {/* Coluna 3 (~20%) — veículo + posição + horário */}
            <div className="flex min-w-0 basis-1/5 flex-col items-end justify-center gap-1 text-right">
                {e.vehiclePlate ? (
                    <p
                        className="max-w-full break-all text-xs font-semibold tabular-nums tracking-wide text-slate-700 md:truncate md:text-sm"
                        title={e.vehiclePlate}
                    >
                        🚗 {e.vehiclePlate}
                    </p>
                ) : null}
                <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-extrabold tabular-nums text-white shadow-md ring-2 ring-teal-100 md:size-9 md:text-sm"
                    aria-label="Posição 1 na fila — última chegada"
                >
                    #1
                </div>
                <p
                    className={cn(
                        'font-semibold tabular-nums text-teal-700',
                        scale.time,
                    )}
                >
                    {timeLabel}
                </p>
            </div>
        </div>
    );
}
