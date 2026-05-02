import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientsTable } from "@/components/company/clientes/ClientsTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { listClients } from "@/db/queries/clients";
import { can } from "@/lib/permissions";

export default async function CompanyClientsPage() {
    const session = await auth();

    if (!session?.user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const role = session.user.role;
    const canAccess =
        role === "company_admin" ||
        (role === "company_operator" &&
            (await can("clients", "can_read")));

    if (!canAccess) {
        redirect("/company/dashboard");
    }

    const canManage = role === "company_admin";
    const rows = await listClients(session.user.companyId);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Clientes"
                description="Cadastro das unidades atendidas pela sua empresa."
            />
            <ClientsTable clients={rows} canManage={canManage} />
        </div>
    );
}
