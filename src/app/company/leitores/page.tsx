import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ReadersTable } from "@/components/company/leitores/ReadersTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { listClients } from "@/db/queries/clients";
import { listReaders } from "@/db/queries/readers";
import { can } from "@/lib/permissions";

export default async function CompanyReadersPage() {
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
    const companyId = session.user.companyId;
    const [readers, clients] = await Promise.all([
        listReaders(companyId),
        listClients(companyId),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Leitores faciais"
                description="Cadastro de leitores vinculados aos clientes da empresa."
            />
            <ReadersTable
                readers={readers}
                clients={clients}
                canManage={canManage}
            />
        </div>
    );
}
