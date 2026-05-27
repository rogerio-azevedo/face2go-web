import {
    BriefcaseBusiness,
    Camera,
    Car,
    GraduationCap,
    ScanLine,
    School,
    Users,
} from "lucide-react";

import { DashboardStatsCard } from "@/components/shared/DashboardStatsCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetchAuthed } from "@/lib/api-fetch";
import type { DashboardStats } from "@/types/domain";

const EMPTY_STATS: DashboardStats = {
    clients: 0,
    students: 0,
    responsibles: 0,
    schoolClasses: 0,
    vehicles: 0,
    facialReaders: 0,
    cameras: 0,
};

export default async function CompanyDashboardPage() {
    let stats: DashboardStats = EMPTY_STATS;

    try {
        const res = await apiFetchAuthed("/api/dashboard/stats");
        if (res.ok) {
            stats = (await res.json()) as DashboardStats;
        }
    } catch {
        stats = EMPTY_STATS;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Painel"
                description="Visão geral dos cadastros da sua empresa."
            />

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <li>
                    <DashboardStatsCard
                        title="Clientes"
                        value={stats.clients ?? 0}
                        description="Total de unidades cadastradas na empresa."
                        icon={BriefcaseBusiness}
                        iconClassName="bg-emerald-600"
                        href="/company/clientes"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Alunos"
                        value={stats.students}
                        description="Alunos cadastrados em todas as unidades."
                        icon={GraduationCap}
                        iconClassName="bg-sky-600"
                        href="/company/clientes"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Responsáveis"
                        value={stats.responsibles}
                        description="Responsáveis vinculados aos alunos."
                        icon={Users}
                        iconClassName="bg-violet-600"
                        href="/company/clientes"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Turmas"
                        value={stats.schoolClasses}
                        description="Turmas ativas nas escolas."
                        icon={School}
                        iconClassName="bg-amber-600"
                        href="/company/clientes"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Veículos"
                        value={stats.vehicles}
                        description="Veículos cadastrados para acesso LPR."
                        icon={Car}
                        iconClassName="bg-orange-600"
                        href="/company/clientes"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Leitores"
                        value={stats.facialReaders}
                        description="Leitores faciais conectados ao sistema."
                        icon={ScanLine}
                        iconClassName="bg-teal-600"
                        href="/company/leitores"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Câmeras"
                        value={stats.cameras}
                        description="Câmeras LPR e de monitoramento cadastradas."
                        icon={Camera}
                        iconClassName="bg-blue-600"
                        href="/company/cameras"
                    />
                </li>
            </ul>
        </div>
    );
}
