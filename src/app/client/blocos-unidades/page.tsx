import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientBlocksPanel } from "@/features/client-blocks/components/ClientBlocksPanel";
import { getClientType } from "@/lib/permissions";

export default async function ClientBlocksUnitsPage() {
    const session = await auth();
    const user = session?.user;

    if (user?.role !== "client_admin" || !user.clientId) {
        redirect("/client/dashboard");
    }
    if ((await getClientType()) !== "condominium") {
        redirect("/client/cadastros");
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Blocos e unidades"
                description="Cadastre os blocos e as unidades antes de receber moradores. Pessoas do mesmo apartamento escolhem a mesma unidade."
            />
            <ClientBlocksPanel clientId={user.clientId} showHeading={false} />
        </div>
    );
}
