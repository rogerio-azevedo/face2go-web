import { redirect } from "next/navigation";

import { ClientSelfInvitePanel } from "@/components/client/ClientSelfInvitePanel";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientSystemUsersTable } from "@/components/shared/ClientSystemUsersTable";
import { auth } from "@/auth";
import { fetchClientSelfSystemUsersAction } from "@/app/client/equipe/actions";

export default async function ClientEquipePage() {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "client_admin") {
        redirect("/client/cadastros");
    }

    const systemUsersResult = await fetchClientSelfSystemUsersAction();

    return (
        <div className="space-y-10">
            <PageHeader
                title="Equipe"
                description="Administradores e operadores que acessam o painel deste cliente."
            />
            <ClientSelfInvitePanel />
            <ClientSystemUsersTable
                users={systemUsersResult.users}
                currentUserId={session?.user?.id}
                variant="client"
            />
        </div>
    );
}
