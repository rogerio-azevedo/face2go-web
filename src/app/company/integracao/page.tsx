import { redirect } from "next/navigation";

import { IntegracaoIenhPanel } from "@/components/company/IntegracaoIenhPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { auth } from "@/auth";
import {
    apiFetchAuthed,
    parseResponseJson,
} from "@/lib/api-fetch";
import type { ClientListRow, IenhFilialMappingRow } from "@/types/domain";

export default async function CompanyIntegracaoPage() {
    const session = await auth();
    const user = session?.user;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const role = user.role;
    if (role !== "company_admin" && role !== "super_admin") {
        redirect("/company/dashboard");
    }

    let clients: ClientListRow[] = [];
    let mappings: IenhFilialMappingRow[] = [];

    try {
        const [clientsRes, mappingsRes] = await Promise.all([
            apiFetchAuthed("/api/clients"),
            apiFetchAuthed("/api/ienh/filial-mappings"),
        ]);
        if (clientsRes.ok) {
            clients = (await parseResponseJson(clientsRes)) as ClientListRow[];
        }
        if (mappingsRes.ok) {
            mappings =
                (await parseResponseJson(mappingsRes)) as IenhFilialMappingRow[];
        }
    } catch {
        clients = [];
        mappings = [];
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Integração IENH"
                description="Mapeie as filiais do ERP TOTVS aos clientes Face2Go e execute a sincronização cadastral manual."
            />
            <IntegracaoIenhPanel
                initialClients={clients}
                initialMappings={mappings}
            />
        </div>
    );
}
