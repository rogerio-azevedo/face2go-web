import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccessTypeToggle } from "@/components/company/acessos/AccessTypeToggle";
import { AccessesTable } from "@/components/company/acessos/AccessesTable";
import { LprAccessesTable } from "@/components/company/acessos/LprAccessesTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetchAuthed } from "@/lib/api-fetch";
import type {
    AccessesListResponse,
    LprAccessesListResponse,
} from "@/types/domain";

type SearchParams = {
    startDate?: string;
    endDate?: string;
    page?: string;
    type?: string;
};

const EMPTY_FACIAL: AccessesListResponse = {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    timezoneOffsetMinutes: 0,
};

const EMPTY_LPR: LprAccessesListResponse = {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    timezoneOffsetMinutes: 0,
};

export default async function ClientAccessesPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await auth();
    const user = session?.user;
    const role = user?.role;
    const sp = await searchParams;

    if (
        !user?.clientId ||
        (role !== "client_admin" && role !== "client_operator")
    ) {
        redirect("/login?error=Sem permissão");
    }

    const isLprTab = sp.type?.trim() === "lpr";

    const qs = new URLSearchParams();
    if (sp.startDate?.trim()) qs.set("startDate", sp.startDate.trim());
    if (sp.endDate?.trim()) qs.set("endDate", sp.endDate.trim());
    if (sp.page?.trim()) qs.set("page", sp.page.trim());

    const query = qs.toString();
    const apiBase = isLprTab
        ? "/api/client/lpr-accesses"
        : "/api/client/accesses";
    const apiPath = query ? `${apiBase}?${query}` : apiBase;

    let facialData: AccessesListResponse = EMPTY_FACIAL;
    let lprData: LprAccessesListResponse = EMPTY_LPR;

    try {
        const accessRes = await apiFetchAuthed(apiPath);
        if (accessRes.ok) {
            const json = (await accessRes.json()) as unknown;
            if (isLprTab) {
                lprData = json as LprAccessesListResponse;
            } else {
                facialData = json as AccessesListResponse;
            }
        }
    } catch {
        facialData = EMPTY_FACIAL;
        lprData = EMPTY_LPR;
    }

    const clientTimezoneOffsetMinutes = isLprTab
        ? (lprData.timezoneOffsetMinutes ?? 0)
        : (facialData.timezoneOffsetMinutes ?? 0);

    const filterDefaults = {
        clientId: user.clientId,
        startDate: sp.startDate?.trim() ?? "",
        endDate: sp.endDate?.trim() ?? "",
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Acessos"
                description="Registros capturados pelos leitores e câmeras da sua unidade."
            />
            <AccessTypeToggle basePath="/client/acessos" />
            {isLprTab ? (
                <LprAccessesTable
                    data={lprData}
                    clientTimezoneOffsetMinutes={clientTimezoneOffsetMinutes}
                    filters={filterDefaults}
                    accessToken={session?.accessToken ?? ""}
                    basePath="/client/acessos"
                    photoApiPath="/api/client/lpr-accesses/:id/photo"
                    hideClientFilter
                />
            ) : (
                <AccessesTable
                    data={facialData}
                    clientTimezoneOffsetMinutes={clientTimezoneOffsetMinutes}
                    filters={filterDefaults}
                    accessToken={session?.accessToken ?? ""}
                    basePath="/client/acessos"
                    photoApiPath="/api/client/accesses/:id/photo"
                    hideClientFilter
                />
            )}
        </div>
    );
}
