import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MonitoringWorkspace } from "@/components/monitoring/MonitoringWorkspace";
import { listPanicEventsAction, listClientMapPointsAction } from "@/app/monitoring/actions";
import { can } from "@/lib/permissions";
import type { PanicEventItem } from "@/types/panic-events";
import type { ClientMapPoint } from "@/types/client-map-point";

export default async function MonitoringPage() {
    const session = await auth();
    const user = session?.user;
    const role = user?.role;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const canAccess =
        role === "company_admin" ||
        (role === "company_operator" && (await can("monitoring", "can_read")));

    if (!canAccess) {
        redirect("/company/dashboard");
    }

    const [listResult, mapResult] = await Promise.all([
        listPanicEventsAction({ limit: 100 }),
        listClientMapPointsAction(),
    ]);
    const initialEvents: PanicEventItem[] = listResult.ok
        ? listResult.data.items
        : [];
    const initialClients: ClientMapPoint[] = mapResult.ok ? mapResult.data : [];

    return (
        <div className="h-full">
            <MonitoringWorkspace
                initialEvents={initialEvents}
                initialClients={initialClients}
            />
        </div>
    );
}
