import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CompanyUsersTable } from "@/components/company/usuarios/CompanyUsersTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { listPermissionsForCompanyUser } from "@/db/queries/permissions";
import { listCompanyUsers } from "@/db/queries/users";

export default async function CompanyUsersPage() {
    const session = await auth();
    if (
        !session?.user?.companyId ||
        session.user.role !== "company_admin"
    ) {
        redirect("/login?error=Sem permissão");
    }

    const companyId = session.user.companyId;
    const users = await listCompanyUsers(companyId);

    const permissionsMap: Record<
        string,
        { featureSlug: string; actions: string[] }[]
    > = {};

    for (const u of users) {
        if (u.role === "company_operator") {
            const rows = await listPermissionsForCompanyUser(u.companyUserId);
            permissionsMap[u.companyUserId] = rows.map((r) => ({
                featureSlug: r.featureSlug,
                actions: r.actions as string[],
            }));
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Usuários da empresa"
                description="Papéis, dados de contato e permissões por módulo (operadores)."
            />
            <CompanyUsersTable
                users={users}
                currentUserId={session.user.id}
                permissionsMap={permissionsMap}
            />
        </div>
    );
}
