import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccessTypeToggle } from "@/components/company/acessos/AccessTypeToggle";
import { AccessesTable } from "@/components/company/acessos/AccessesTable";
import { LprAccessesTable } from "@/components/company/acessos/LprAccessesTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetchAuthed } from "@/lib/api-fetch";
import type { CatalogBlock } from "@/features/client-blocks/types";
import type { BlockUnitOption } from "@/features/client-blocks/components/BlockUnitSelects";
import type {
    AccessesListResponse,
    LprAccessesListResponse,
} from "@/types/domain";

type SearchParams = {
    startDate?: string;
    endDate?: string;
    page?: string;
    type?: string;
    name?: string;
    blockId?: string;
    unitId?: string;
    readerId?: string;
    onlyDenied?: string;
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
    const clientId = user?.clientId;
    const sp = await searchParams;

    if (
        !clientId ||
        (role !== "client_admin" && role !== "client_operator")
    ) {
        redirect("/login?error=Sem permissão");
    }

    const isLprTab = sp.type?.trim() === "lpr";

    const qs = new URLSearchParams();
    if (sp.startDate?.trim()) qs.set("startDate", sp.startDate.trim());
    if (sp.endDate?.trim()) qs.set("endDate", sp.endDate.trim());
    if (sp.page?.trim()) qs.set("page", sp.page.trim());
    if (!isLprTab) {
        if (sp.name?.trim()) qs.set("name", sp.name.trim());
        if (sp.blockId?.trim()) qs.set("blockId", sp.blockId.trim());
        if (sp.unitId?.trim()) qs.set("unitId", sp.unitId.trim());
        if (sp.readerId?.trim()) qs.set("readerId", sp.readerId.trim());
        if (sp.onlyDenied === "true") qs.set("onlyDenied", "true");
    }

    const query = qs.toString();
    const apiBase = isLprTab
        ? "/api/client/lpr-accesses"
        : "/api/client/accesses";
    const apiPath = query ? `${apiBase}?${query}` : apiBase;

    let facialData: AccessesListResponse = EMPTY_FACIAL;
    let lprData: LprAccessesListResponse = EMPTY_LPR;
    let readers: { id: string; name: string }[] = [];
    let locationBlocks: BlockUnitOption[] | undefined;

    try {
        const [accessRes, readersRes] = await Promise.all([
            apiFetchAuthed(apiPath),
            isLprTab
                ? Promise.resolve(null)
                : apiFetchAuthed("/api/client/readers"),
        ]);
        if (accessRes.ok) {
            const json = (await accessRes.json()) as unknown;
            if (isLprTab) {
                lprData = json as LprAccessesListResponse;
            } else {
                facialData = json as AccessesListResponse;
            }
        }
        if (readersRes?.ok) {
            readers = (await readersRes.json()) as { id: string; name: string }[];
        }
    } catch {
        facialData = EMPTY_FACIAL;
        lprData = EMPTY_LPR;
        readers = [];
    }

    if (!isLprTab) {
        try {
            const blocksRes = await apiFetchAuthed(
                `/api/clients/${clientId}/blocks`,
            );
            if (blocksRes.ok) {
                const items = (await blocksRes.json()) as CatalogBlock[];
                locationBlocks = items
                    .filter((block) => block.isActive)
                    .map((block) => ({
                        id: block.id,
                        name: block.name,
                        units: block.units
                            .filter((unit) => unit.isActive)
                            .map((unit) => ({ id: unit.id, name: unit.name })),
                    }));
            }
        } catch {
            locationBlocks = undefined;
        }
    }

    const clientTimezoneOffsetMinutes = isLprTab
        ? (lprData.timezoneOffsetMinutes ?? 0)
        : (facialData.timezoneOffsetMinutes ?? 0);

    const filterDefaults = {
        clientId,
        startDate: sp.startDate?.trim() ?? "",
        endDate: sp.endDate?.trim() ?? "",
        name: sp.name?.trim() ?? "",
        blockId: sp.blockId?.trim() ?? "",
        unitId: sp.unitId?.trim() ?? "",
        readerId: sp.readerId?.trim() ?? "",
        onlyDenied: sp.onlyDenied === "true",
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
                    readers={readers.map((reader) => ({
                        id: reader.id,
                        name: reader.name,
                        clientId,
                    }))}
                    clientTimezoneOffsetMinutes={clientTimezoneOffsetMinutes}
                    filters={filterDefaults}
                    locationBlocks={locationBlocks}
                    accessToken={session?.accessToken ?? ""}
                    basePath="/client/acessos"
                    photoApiPath="/api/client/accesses/:id/photo"
                    hideClientFilter
                />
            )}
        </div>
    );
}
