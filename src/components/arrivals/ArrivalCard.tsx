'use client';

import type {
    ArrivalLayout,
    ArrivalSseArrivalPayload,
} from '@/components/arrivals/arrival-types';
import { FaceCirclePhoto } from '@/components/ui/face-circle-photo';
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

/** Escala de fontes/fotos conforme quantidade de alunos (banner + cards). */
export type ArrivalCardScale = {
    responsiblePhoto: string;
    responsibleName: string;
    reader: string;
    time: string;
    studentPhoto: string;
    studentName: string;
    studentClass: string;
};

export function getCardScale(studentCount: number): ArrivalCardScale {
    if (studentCount <= 0) {
        return {
            responsiblePhoto: 'size-20 md:size-24',
            responsibleName: 'text-xl md:text-2xl',
            reader: 'text-sm md:text-base',
            time: 'text-lg md:text-xl',
            studentPhoto: 'size-14 md:size-16',
            studentName: 'text-lg md:text-xl',
            studentClass: 'text-sm md:text-base',
        };
    }
    if (studentCount <= 2) {
        return {
            responsiblePhoto: 'size-[4.25rem] md:size-20',
            responsibleName: 'text-lg md:text-xl',
            reader: 'text-xs md:text-sm',
            time: 'text-base md:text-lg',
            studentPhoto: 'size-16 md:size-[4.25rem]',
            studentName: 'text-base md:text-lg',
            studentClass: 'text-sm md:text-base',
        };
    }
    if (studentCount <= 3) {
        return {
            responsiblePhoto: 'size-16 md:size-20',
            responsibleName: 'text-lg md:text-xl',
            reader: 'text-xs md:text-sm',
            time: 'text-base md:text-lg',
            studentPhoto: 'size-14 md:size-[3.75rem]',
            studentName: 'text-base md:text-lg',
            studentClass: 'text-sm md:text-base',
        };
    }
    if (studentCount === 4) {
        return {
            responsiblePhoto: 'size-16 md:size-20',
            responsibleName: 'text-lg md:text-xl',
            reader: 'text-xs md:text-sm',
            time: 'text-base md:text-lg',
            studentPhoto: 'size-14 md:size-[3.75rem]',
            studentName: 'text-sm md:text-base',
            studentClass: 'text-xs md:text-sm',
        };
    }
    return {
        responsiblePhoto: 'size-14 md:size-16',
        responsibleName: 'text-sm md:text-base',
        reader: 'text-[11px] md:text-xs',
        time: 'text-xs md:text-sm',
        studentPhoto: 'size-10 md:size-12',
        studentName: 'text-xs md:text-sm',
        studentClass: 'text-xs',
    };
}

/** Cartão para grade — responsável visível à distância e filhos com foto + nome destacados. */
export function ArrivalCardGrid(props: {
    event: ArrivalSseArrivalPayload;
    isNew: boolean;
    layout: ArrivalLayout;
    /** Posição na fila (1 = mais recente no banner; aqui tipicamente 2+). */
    position?: number;
}) {
    const { event: e, isNew, layout, position } = props;
    const t = formatArrivalTime(e.eventDate);
    const vertical = layout === 'vertical';
    const scale = getCardScale(e.students.length);

    return (
        <div
            className={cn(
                'relative flex flex-col rounded-xl border bg-white shadow-sm transition-shadow',
                vertical
                    ? 'gap-2 p-2 md:gap-2.5 md:p-2.5'
                    : 'h-full min-h-[18.5rem] md:min-h-[20rem] gap-1.5 p-1.5 md:gap-2 md:p-2',
                isNew
                    ? 'border-teal-400 ring-2 ring-teal-500 ring-offset-2 ring-offset-white animate-pulse'
                    : 'border-slate-100',
            )}
        >
            <div className="flex shrink-0 gap-2 md:gap-2.5">
                <div
                    className={cn(
                        'shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-slate-100',
                        scale.responsiblePhoto,
                    )}
                >
                    <FaceCirclePhoto
                        className="size-full"
                        photoUrl={e.personPhotoUrl}
                        nameHint={e.personName}
                    />
                </div>
                <div className="flex min-w-0 flex-1 gap-2">
                    <div className="min-w-0 flex-1">
                        <p
                            className={cn(
                                'line-clamp-2 font-bold leading-snug text-slate-900',
                                scale.responsibleName,
                            )}
                        >
                            {e.personName?.trim() || 'Sem nome'}
                        </p>
                        <p
                            className={cn(
                                'truncate text-slate-500',
                                scale.reader,
                            )}
                        >
                            {e.readerName}
                        </p>
                        <p
                            className={cn(
                                'mt-0.5 font-semibold tabular-nums text-teal-600',
                                scale.time,
                            )}
                        >
                            {t}
                        </p>
                    </div>
                    {e.vehiclePlate != null || position != null ? (
                        <div
                            className={cn(
                                'flex shrink-0 flex-col items-end gap-1',
                                vertical ? 'pt-0.5' : 'pt-0',
                            )}
                        >
                            {e.vehiclePlate ? (
                                <p
                                    className={cn(
                                        'max-w-[9rem] truncate text-right font-semibold tabular-nums tracking-wide text-slate-700',
                                        vertical
                                            ? 'text-base md:text-lg'
                                            : 'text-sm md:text-base',
                                    )}
                                    title={e.vehiclePlate}
                                >
                                    🚗 {e.vehiclePlate}
                                </p>
                            ) : null}
                            {position != null ? (
                                <div
                                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-extrabold tabular-nums text-white shadow-md ring-2 ring-white md:size-9 md:text-sm"
                                    aria-label={`Posição ${position} na fila`}
                                >
                                    #{position}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            {e.students.length > 0 ? (
                <div
                    className={cn(
                        'flex min-h-0 flex-col border-t border-slate-100 pt-1.5',
                        !vertical && 'h-44 shrink-0 md:h-[11.5rem]',
                    )}
                >
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 md:text-[11px]">
                        Alunos
                    </p>
                    <ul
                        className={cn(
                            'grid min-h-0 flex-1 grid-cols-2 gap-x-1.5 gap-y-1 overflow-y-auto overflow-x-hidden overscroll-contain',
                            vertical
                                ? 'md:gap-x-2.5 md:gap-y-2'
                                : 'md:gap-x-2 md:gap-y-1',
                        )}
                    >
                        {e.students.map((s, index) => (
                            <li
                                key={`${e.accessId}-st-${index}-${s.name}`}
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
                    <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-slate-600">
                        {e.students
                            .map((s) =>
                                s.className
                                    ? `${s.name} (${s.className})`
                                    : s.name,
                            )
                            .join(' · ')}
                    </p>
                ) : null}
            </div>
        </li>
    );
}
