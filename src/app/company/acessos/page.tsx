import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccessTypeToggle } from "@/components/company/acessos/AccessTypeToggle";
import { AccessesTable } from "@/components/company/acessos/AccessesTable";
import { LprAccessesTable } from "@/components/company/acessos/LprAccessesTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetchAuthed } from "@/lib/api-fetch";
import { can } from "@/lib/permissions";
import type {
    AccessesListResponse,
    ClientListRow,
    LprAccessesListResponse,
    ReaderListRow,
} from "@/types/domain";

type SearchParams = {
    clientId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    type?: string;
    name?: string;
    block?: string;
    unit?: string;
    readerId?: string;
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

    const isLprTab = sp.type?.trim() === "lpr";

    /** Offset do cliente no filtro; listagem mista usa o offset de cada cliente na tabela */
    let clientTimezoneOffsetMinutes = 0;

    const qs = new URLSearchParams();
    if (sp.clientId?.trim()) qs.set("clientId", sp.clientId.trim());
    if (sp.startDate?.trim()) qs.set("startDate", sp.startDate.trim());
    if (sp.endDate?.trim()) qs.set("endDate", sp.endDate.trim());
    if (sp.page?.trim()) qs.set("page", sp.page.trim());
    if (!isLprTab) {
        if (sp.name?.trim()) qs.set("name", sp.name.trim());
        if (sp.block?.trim()) qs.set("block", sp.block.trim());
        if (sp.unit?.trim()) qs.set("unit", sp.unit.trim());
        if (sp.readerId?.trim()) qs.set("readerId", sp.readerId.trim());
    }

    const query = qs.toString();
    const apiBase = isLprTab ? "/api/lpr-accesses" : "/api/accesses";
    const apiPath = query ? `${apiBase}?${query}` : apiBase;

    let facialData: AccessesListResponse = {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
    };
    let lprData: LprAccessesListResponse = {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
    };
    let clients: ClientListRow[] = [];
    let readers: ReaderListRow[] = [];

    try {
        const [accessRes, clientsRes, readersRes] = await Promise.all([
            apiFetchAuthed(apiPath),
            apiFetchAuthed("/api/clients"),
            isLprTab
                ? Promise.resolve(null)
                : apiFetchAuthed("/api/readers"),
        ]);

        if (accessRes.ok) {
            const json = (await accessRes.json()) as unknown;
            if (isLprTab) {
                lprData = json as LprAccessesListResponse;
            } else {
                facialData = json as AccessesListResponse;
            }
        }
        if (clientsRes.ok) {
            clients = (await clientsRes.json()) as ClientListRow[];
            const cid = sp.clientId?.trim();
            if (cid) {
                const match = clients.find((c) => c.id === cid);
                clientTimezoneOffsetMinutes = match?.timezoneOffsetMinutes ?? 0;
            }
        }
        if (readersRes?.ok) {
            readers = (await readersRes.json()) as ReaderListRow[];
        }
    } catch {
        if (isLprTab) {
            lprData = { items: [], page: 1, pageSize: 20, total: 0 };
        } else {
            facialData = { items: [], page: 1, pageSize: 20, total: 0 };
        }
        clients = [];
        readers = [];
    }

    const filterDefaults = {
        clientId: sp.clientId?.trim() ?? "",
        startDate: sp.startDate?.trim() ?? "",
        endDate: sp.endDate?.trim() ?? "",
        name: sp.name?.trim() ?? "",
        block: sp.block?.trim() ?? "",
        unit: sp.unit?.trim() ?? "",
        readerId: sp.readerId?.trim() ?? "",
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Acessos"
                description="Registros capturados pelos leitores e câmeras Intelbras (stream em tempo real)."
            />
            <AccessTypeToggle />
            {isLprTab ? (
                <LprAccessesTable
                    data={lprData}
                    clients={clients}
                    clientTimezoneOffsetMinutes={
                        clientTimezoneOffsetMinutes
                    }
                    filters={filterDefaults}
                    accessToken={session?.accessToken ?? ""}
                />
            ) : (
                <AccessesTable
                    data={facialData}
                    clients={clients}
                    readers={readers.map((reader) => ({
                        id: reader.id,
                        name: reader.name,
                        clientId: reader.clientId,
                        clientName: reader.clientName,
                    }))}
                    clientTimezoneOffsetMinutes={
                        clientTimezoneOffsetMinutes
                    }
                    filters={filterDefaults}
                    accessToken={session?.accessToken ?? ""}
                />
            )}
        </div>
    );
}
