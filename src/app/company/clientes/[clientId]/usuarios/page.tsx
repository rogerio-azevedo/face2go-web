import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientDetailTabs } from "@/components/company/clientes/ClientDetailTabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { can } from "@/lib/permissions";
import { apiFetchAuthed, parseResponseJson } from "@/lib/api-fetch";
import type { ClientListRow } from "@/types/domain";

export default async function CompanyClientUsuariosPage({
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

    const canAccess =
        role === "company_admin" ||
        (role === "company_operator" && (await can("clients", "can_read")));

    if (!canAccess) {
        redirect("/company/dashboard");
    }

    const canEditAddresses =
        role === "company_admin" ||
        (role === "company_operator" && (await can("clients", "can_update")));

    let clientMeta: Pick<ClientListRow, "name" | "type"> | null = null;

    try {
        const clientRes = await apiFetchAuthed(`/api/clients/${clientId}`);
        if (clientRes.ok) {
            const data = (await parseResponseJson(clientRes)) as ClientListRow | null;
            if (data) {
                clientMeta = { name: data.name, type: data.type };
            }
        }
    } catch {
        clientMeta = null;
    }

    const clientName = clientMeta?.name ?? null;

    return (
        <div className="space-y-8">
            <PageHeader
                title={
                    clientName
                        ? `${clientName} — Gerenciar`
                        : "Gerenciar cliente"
                }
                description={
                    clientMeta?.type === "school"
                        ? "Gerencie horários, turmas, alunos, responsáveis, membros e veículos da escola."
                        : "Cadastro via link e solicitações."
                }
            />
            <ClientDetailTabs
                clientId={clientId}
                clientType={clientMeta?.type ?? "other"}
                isAdmin={role === "company_admin"}
                canEditAddresses={canEditAddresses}
            />
        </div>
    );
}
