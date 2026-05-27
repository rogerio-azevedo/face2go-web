import {
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
    students: 0,
    responsibles: 0,
    schoolClasses: 0,
    vehicles: 0,
    facialReaders: 0,
    cameras: 0,
};

export default async function ClientDashboardPage() {
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
                description="Visão geral dos cadastros da sua unidade."
            />

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <li>
                    <DashboardStatsCard
                        title="Alunos"
                        value={stats.students}
                        description="Alunos cadastrados na unidade."
                        icon={GraduationCap}
                        iconClassName="bg-sky-600"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Responsáveis"
                        value={stats.responsibles}
                        description="Responsáveis vinculados aos alunos."
                        icon={Users}
                        iconClassName="bg-violet-600"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Turmas"
                        value={stats.schoolClasses}
                        description="Turmas cadastradas na escola."
                        icon={School}
                        iconClassName="bg-amber-600"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Veículos"
                        value={stats.vehicles}
                        description="Veículos cadastrados para acesso LPR."
                        icon={Car}
                        iconClassName="bg-orange-600"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Leitores"
                        value={stats.facialReaders}
                        description="Leitores faciais da unidade."
                        icon={ScanLine}
                        iconClassName="bg-teal-600"
                    />
                </li>
                <li>
                    <DashboardStatsCard
                        title="Câmeras"
                        value={stats.cameras}
                        description="Câmeras LPR e de monitoramento da unidade."
                        icon={Camera}
                        iconClassName="bg-blue-600"
                    />
                </li>
            </ul>
        </div>
    );
}
