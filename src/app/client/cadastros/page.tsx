import { redirect } from "next/navigation";

import { ClientRegistrationLinksPanel } from "@/components/client/ClientRegistrationLinksPanel";
import { ClientBlocksPanel } from "@/features/client-blocks/components/ClientBlocksPanel";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { auth } from "@/auth";
import {
    apiFetchAuthed,
    parseResponseJson,
} from "@/lib/api-fetch";
import type { RegistrationListTab } from "@/features/registrations/lib/registration-format";
import type { RegistrationLinkListRow } from "@/types/domain";

const REGISTRATION_TABS: RegistrationListTab[] = [
    "draft",
    "approved",
    "rejected",
    "blocked",
    "deleted",
];

function registrationTab(value: string | undefined): RegistrationListTab {
    if (value && REGISTRATION_TABS.includes(value as RegistrationListTab)) {
        return value as RegistrationListTab;
    }
    return "draft";
}

export default async function ClientCadastrosPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string; tab?: string }>;
}) {
    const session = await auth();
    const role = session?.user?.role;
    const sp = await searchParams;
    const initialShowLinks = sp.view === "links";
    const initialTab = registrationTab(sp.tab);
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

    const clientId = session?.user?.clientId;
    let clientType: string | null = null;
    if (clientId && role === "client_admin") {
        try {
            const typeRes = await apiFetchAuthed(
                "/api/client/registrations?page=1&pageSize=1",
            );
            if (typeRes.ok) {
                const body = (await parseResponseJson(typeRes)) as {
                    clientType?: unknown;
                };
                clientType =
                    typeof body.clientType === "string" ? body.clientType : null;
            }
        } catch {
            clientType = null;
        }
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
            {clientType === "condominium" && clientId && role === "client_admin" ? (
                <ClientBlocksPanel clientId={clientId} />
            ) : null}
            <RegistrationsReviewBoard
                key={`${initialShowLinks ? "links" : "list"}-${initialTab}`}
                variant="client"
                isAdmin={role === "client_admin"}
                initialShowLinks={initialShowLinks}
                initialTab={initialTab}
                linksCount={links.filter((row) => row.isActive).length}
                linksPanel={
                    <ClientRegistrationLinksPanel
                        initialLinks={links}
                        clientName={clientName}
                    />
                }
                blocksClientId={clientId}
            />
        </div>
    );
}
