import {
    Car,
    GraduationCap,
    History,
    ScanLine,
    School,
    ShieldX,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { calendarDateInOffset } from "@/features/dashboard/lib/calendar-date";
import type { ClientDashboard } from "@/features/dashboard/types";

export type ClientKpiItem = {
    title: string;
    value: number;
    description: string;
    icon: LucideIcon;
    iconClassName: string;
    href?: string;
};

export function buildClientKpis(
    data: ClientDashboard,
    options: { canOpenReaders: boolean },
): ClientKpiItem[] {
    const today = calendarDateInOffset(data.timezoneOffsetMinutes);
    const todayQuery = `startDate=${today}&endDate=${today}`;
    const accessesToday = data.accessesToday.granted + data.accessesToday.denied;
    const readersHref = options.canOpenReaders ? "/client/leitores" : undefined;
    const readersCard: ClientKpiItem = {
        title: "Leitores online",
        value: data.readers.online,
        description: `${data.readers.online} de ${data.readers.total} conectados.`,
        icon: ScanLine,
        iconClassName: "bg-teal-600",
        href: readersHref,
    };
    const accessesCard: ClientKpiItem = {
        title: "Acessos hoje",
        value: accessesToday,
        description: `${data.accessesToday.granted} liberados, ${data.accessesToday.denied} negados.`,
        icon: History,
        iconClassName: "bg-sky-600",
        href: `/client/acessos?${todayQuery}`,
    };

    if (data.clientType === "school") {
        return [
            {
                title: "Alunos",
                value: data.people.students,
                description: "Alunos ativos na unidade.",
                icon: GraduationCap,
                iconClassName: "bg-sky-600",
            },
            {
                title: "Responsáveis",
                value: data.people.responsibles,
                description: "Responsáveis ativos vinculados aos alunos.",
                icon: Users,
                iconClassName: "bg-violet-600",
            },
            {
                title: "Turmas",
                value: data.schoolClasses,
                description: "Turmas cadastradas na escola.",
                icon: School,
                iconClassName: "bg-amber-600",
            },
            accessesCard,
            readersCard,
        ];
    }

    const cards: ClientKpiItem[] = [
        {
            title: "Pessoas",
            value: data.people.members,
            description: "Pessoas com acesso liberado na unidade.",
            icon: Users,
            iconClassName: "bg-violet-600",
            href: "/client/cadastros?tab=approved",
        },
        accessesCard,
        {
            title: "Negados hoje",
            value: data.accessesToday.denied,
            description: "Tentativas de acesso recusadas hoje.",
            icon: ShieldX,
            iconClassName: "bg-rose-600",
            href: `/client/acessos?onlyDenied=true&${todayQuery}`,
        },
        readersCard,
    ];

    if (data.vehicles > 0) {
        cards.push({
            title: "Veículos",
            value: data.vehicles,
            description: "Veículos cadastrados para acesso LPR.",
            icon: Car,
            iconClassName: "bg-orange-600",
        });
    }

    return cards;
}
