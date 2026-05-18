'use client';

import { useEffect, useState } from 'react';

export function DisplayClock({ className }: { className?: string }) {
    const [tick, setTick] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setTick(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const d = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(tick));

    const titleCase = (s: string) =>
        s ? s.charAt(0).toUpperCase() + s.slice(1).replace('.', '') : s;

    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm md:text-left ${className ?? ''}`}
        >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
                Hoje
            </p>
            <p className="text-sm font-semibold leading-snug text-slate-800 md:text-base">
                {titleCase(d)}
            </p>
        </div>
    );
}
