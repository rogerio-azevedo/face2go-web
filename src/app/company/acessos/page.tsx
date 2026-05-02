import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccessesTable } from "@/components/company/acessos/AccessesTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetchAuthed } from "@/lib/api-fetch";
import { can } from "@/lib/permissions";
import type { AccessesListResponse, ClientListRow } from "@/types/domain";

type SearchParams = {
    clientId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
};

export default async function CompanyAccessesPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await auth();
    const user = session?.user;
    const sp = await searchParams;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const role = user.role;
    const canAccess =
        role === "company_admin" ||
        (role === "company_operator" && (await can("clients", "can_read")));

    if (!canAccess) {
        redirect("/company/dashboard");
    }

    /** Offset do cliente no filtro; listagem mista usa o offset de cada cliente na tabela */
    let clientTimezoneOffsetMinutes = 0;

    const qs = new URLSearchParams();
    if (sp.clientId?.trim()) qs.set("clientId", sp.clientId.trim());
    if (sp.startDate?.trim()) qs.set("startDate", sp.startDate.trim());
    if (sp.endDate?.trim()) qs.set("endDate", sp.endDate.trim());
    if (sp.page?.trim()) qs.set("page", sp.page.trim());

    const query = qs.toString();
    const path = query ? `/api/accesses?${query}` : "/api/accesses";

    let data: AccessesListResponse = {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
    };
    let clients: ClientListRow[] = [];

    try {
        const [accessRes, clientsRes] = await Promise.all([
            apiFetchAuthed(path),
            apiFetchAuthed("/api/clients"),
        ]);

        if (accessRes.ok) {
            data = (await accessRes.json()) as AccessesListResponse;
        }
        if (clientsRes.ok) {
            clients = (await clientsRes.json()) as ClientListRow[];
            const cid = sp.clientId?.trim();
            if (cid) {
                const match = clients.find((c) => c.id === cid);
                clientTimezoneOffsetMinutes = match?.timezoneOffsetMinutes ?? 0;
            }
        }
    } catch {
        data = { items: [], page: 1, pageSize: 20, total: 0 };
        clients = [];
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Acessos faciais"
                description="Registros capturados pelos leitores Intelbras (stream em tempo real)."
            />
            <AccessesTable
                data={data}
                clients={clients}
                clientTimezoneOffsetMinutes={clientTimezoneOffsetMinutes}
                filters={{
                    clientId: sp.clientId?.trim() ?? "",
                    startDate: sp.startDate?.trim() ?? "",
                    endDate: sp.endDate?.trim() ?? "",
                }}
            />
        </div>
    );
}
