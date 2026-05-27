import { redirect } from "next/navigation";

import { ClientRegistrationLinksPanel } from "@/components/client/ClientRegistrationLinksPanel";
import { ClientSelfInvitePanel } from "@/components/client/ClientSelfInvitePanel";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { SyncAllProgressModal } from "@/components/registrations/SyncAllProgressModal";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientSystemUsersTable } from "@/components/shared/ClientSystemUsersTable";
import { auth } from "@/auth";
import { fetchClientSelfSystemUsersAction } from "@/app/client/usuarios/client-system-actions";
import {
    apiFetchAuthed,
    parseResponseJson,
} from "@/lib/api-fetch";
import type {
    ClientRegistrationListRow,
    RegistrationLinkListRow,
} from "@/types/domain";

export default async function ClientUsuariosPage() {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "client_admin" && role !== "client_operator") {
        redirect("/client/dashboard");
    }

    let links: RegistrationLinkListRow[] = [];
    let registrations: ClientRegistrationListRow[] = [];
    let clientSystemUsers: Awaited<
        ReturnType<typeof fetchClientSelfSystemUsersAction>
    >["users"] = [];

    if (role === "client_admin") {
        const systemUsersResult = await fetchClientSelfSystemUsersAction();
        clientSystemUsers = systemUsersResult.users;
    }

    try {
        const [linksRes, regRes] = await Promise.all([
            apiFetchAuthed("/api/client/registration-links"),
            apiFetchAuthed("/api/client/registrations"),
        ]);
        if (linksRes.ok) {
            links = (await parseResponseJson(linksRes)) as RegistrationLinkListRow[];
        }
        if (regRes.ok) {
            registrations =
                (await parseResponseJson(regRes)) as ClientRegistrationListRow[];
        }
    } catch {
        links = [];
        registrations = [];
    }

    return (
        <div className="space-y-10">
            <PageHeader
                title="Usuários do cliente"
                description="Gere links de cadastro e analise as solicitações recebidas (foto no R2, aprovação pelo painel)."
            />
            {role === "client_admin" ? (
                <section className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold">
                            Usuários do sistema
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Convites para administradores e operadores deste
                            cliente.
                        </p>
                    </div>
                    <ClientSelfInvitePanel />
                    <ClientSystemUsersTable users={clientSystemUsers} />
                </section>
            ) : null}
            <section className="space-y-3">
                <h2 className="text-sm font-medium">Links de cadastro</h2>
                <ClientRegistrationLinksPanel initialLinks={links} />
            </section>
            <section className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-medium">
                        Solicitações recebidas
                    </h2>
                    <SyncAllProgressModal variant="client" />
                </div>
                <RegistrationsReviewBoard
                    variant="client"
                    initialRows={registrations}
                />
            </section>
        </div>
    );
}
