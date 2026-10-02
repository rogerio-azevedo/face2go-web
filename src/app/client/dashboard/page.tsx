import { auth } from "@/auth";
import { ClientKpis } from "@/features/dashboard/components/ClientKpis";
import { GettingStartedChecklist } from "@/features/dashboard/components/GettingStartedChecklist";
import { PendingRegistrationsCard } from "@/features/dashboard/components/PendingRegistrationsCard";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentAccessesList } from "@/features/dashboard/components/RecentAccessesList";
import { buildClientKpis } from "@/features/dashboard/lib/client-kpis";
import type { ClientDashboard } from "@/features/dashboard/types";
import { apiFetchAuthed } from "@/lib/api-fetch";
import { PageHeader } from "@/components/shared/PageHeader";

const EMPTY_DASHBOARD: ClientDashboard = {
    clientType: "other",
    timezoneOffsetMinutes: 0,
    registrations: { pending: 0, approved: 0 },
    activeRegistrationLinks: 0,
    people: { members: 0, students: 0, responsibles: 0 },
    schoolClasses: 0,
    vehicles: 0,
    cameras: 0,
    readers: { total: 0, online: 0 },
    accessesToday: { granted: 0, denied: 0 },
    recentAccesses: [],
};

function unitName(
    context: { type?: string; clientName?: string } | null | undefined,
): string | null {
    if (
        context &&
        (context.type === "client" ||
            context.type === "member" ||
            context.type === "responsible") &&
        context.clientName
    ) {
        return context.clientName;
    }
    return null;
}

export default async function ClientDashboardPage() {
    const session = await auth();
    const role = session?.user?.role;
    const canManage = role === "client_admin" || role === "client_operator";
    const canManageReaders = role === "client_admin";
    const name = unitName(session?.activeContext);

    let data = EMPTY_DASHBOARD;
    try {
        const res = await apiFetchAuthed("/api/client/dashboard");
        if (res.ok) {
            data = (await res.json()) as ClientDashboard;
        }
    } catch {
        data = EMPTY_DASHBOARD;
    }

    const peopleCount =
        data.people.members + data.people.students + data.people.responsibles;
    const operating = data.readers.total > 0 && peopleCount > 0;
    const setupDone =
        data.readers.online > 0 &&
        data.activeRegistrationLinks > 0 &&
        data.registrations.approved > 0;

    const description = !canManage
        ? "Acessos e pessoas da unidade."
        : data.clientType === "school"
          ? "Alunos, acessos de hoje e o que ainda precisa de aprovação."
          : "Pessoas, acessos de hoje e o que ainda precisa de aprovação.";

    return (
        <div className="space-y-6">
            <PageHeader
                title={name ? `Olá, ${name}` : "Painel"}
                description={description}
            />

            {canManage && data.registrations.pending > 0 ? (
                <PendingRegistrationsCard count={data.registrations.pending} />
            ) : null}

            {canManage && !operating && !setupDone ? (
                <GettingStartedChecklist
                    readerOnline={data.readers.online > 0}
                    hasRegistrationLink={data.activeRegistrationLinks > 0}
                    hasApprovedRegistration={data.registrations.approved > 0}
                    canManageReaders={canManageReaders}
                />
            ) : null}

            {canManage ? (
                <QuickActions
                    pendingCount={data.registrations.pending}
                    canManageReaders={canManageReaders}
                />
            ) : null}

            <ClientKpis
                items={buildClientKpis(data, {
                    canOpenReaders: canManageReaders,
                })}
            />

            <RecentAccessesList
                items={data.recentAccesses}
                timezoneOffsetMinutes={data.timezoneOffsetMinutes}
            />
        </div>
    );
}
