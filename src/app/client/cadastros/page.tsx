import { redirect } from "next/navigation";

import { ClientRegistrationLinksPanel } from "@/components/client/ClientRegistrationLinksPanel";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { auth } from "@/auth";
import {
    apiFetchAuthed,
    parseResponseJson,
} from "@/lib/api-fetch";
import type { RegistrationLinkListRow } from "@/types/domain";

export default async function ClientCadastrosPage() {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "client_admin" && role !== "client_operator") {
        redirect("/client/dashboard");
    }

    let links: RegistrationLinkListRow[] = [];

    try {
        const linksRes = await apiFetchAuthed("/api/client/registration-links");
        if (linksRes.ok) {
            links = (await parseResponseJson(linksRes)) as RegistrationLinkListRow[];
        }
    } catch {
        links = [];
    }

    const clientName =
        session?.activeContext?.type === "client"
            ? session.activeContext.clientName
            : "Cliente";

    return (
        <div className="space-y-10">
            <PageHeader
                title="Cadastros"
                description="Moradores, colaboradores e visitantes que acessam pelo leitor facial."
            />
            <RegistrationsReviewBoard
                variant="client"
                isAdmin={role === "client_admin"}
                linksCount={links.filter((row) => row.isActive).length}
                linksPanel={
                    <ClientRegistrationLinksPanel
                        initialLinks={links}
                        clientName={clientName}
                    />
                }
            />
        </div>
    );
}
