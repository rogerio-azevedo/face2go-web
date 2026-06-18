import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientAddressesPanel } from "@/components/company/clientes/enderecos/ClientAddressesPanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { listClientAddressesAction } from "@/app/company/clientes/[clientId]/enderecos/actions";
import { can } from "@/lib/permissions";
import { apiFetchAuthed } from "@/lib/api-fetch";
import type { ClientListRow } from "@/types/domain";
import type { ClientAddressRow } from "@/types/client-address";

export default async function CompanyClientEnderecosPage({
    params,
}: {
    params: Promise<{ clientId: string }>;
}) {
    const { clientId } = await params;
    const session = await auth();
    const user = session?.user;
    const role = user?.role;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const canRead =
        role === "company_admin" ||
        (role === "company_operator" && (await can("clients", "can_read")));

    if (!canRead) {
        redirect("/company/dashboard");
    }

    const canEdit =
        role === "company_admin" ||
        (role === "company_operator" && (await can("clients", "can_update")));

    let clientName = "Cliente";
    const clientRes = await apiFetchAuthed(
        `/api/clients/${encodeURIComponent(clientId)}`,
    );
    if (clientRes.ok) {
        const client = (await clientRes.json()) as ClientListRow;
        clientName = client.name;
    }

    const listResult = await listClientAddressesAction(clientId);
    const addresses: ClientAddressRow[] = listResult.ok ? listResult.data : [];

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Endereços — ${clientName}`}
                description="Gerencie endereços e coordenadas do cliente."
            />
            <ClientAddressesPanel
                clientId={clientId}
                initialAddresses={addresses}
                canEdit={canEdit}
            />
        </div>
    );
}
