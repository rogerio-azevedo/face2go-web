import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CompanyClientRegistrationLinksPanel } from "@/components/company/clientes/CompanyClientRegistrationLinksPanel";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { SyncAllProgressModal } from "@/components/registrations/SyncAllProgressModal";
import { PageHeader } from "@/components/shared/PageHeader";
import { can } from "@/lib/permissions";
import {
    apiFetchAuthed,
    parseResponseJson,
} from "@/lib/api-fetch";
import type {
    ClientListRow,
    ClientRegistrationListRow,
    RegistrationLinkListRow,
} from "@/types/domain";

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

    let clientName: string | null = null;
    let links: RegistrationLinkListRow[] = [];
    let rows: ClientRegistrationListRow[] = [];

    try {
        const [clientsRes, linksRes, regRes] = await Promise.all([
            apiFetchAuthed("/api/clients"),
            apiFetchAuthed(
                `/api/clients/${clientId}/registration-links`,
            ),
            apiFetchAuthed(`/api/clients/${clientId}/registrations`),
        ]);

        if (clientsRes.ok) {
            const list = (await parseResponseJson(clientsRes)) as ClientListRow[];
            clientName =
                list.find((c) => c.id === clientId)?.name ?? null;
        }
        if (linksRes.ok) {
            links = (await parseResponseJson(linksRes)) as RegistrationLinkListRow[];
        }
        if (regRes.ok) {
            rows = (await parseResponseJson(regRes)) as ClientRegistrationListRow[];
        }
    } catch {
        links = [];
        rows = [];
    }

    return (
        <div className="space-y-10">
            <PageHeader
                title={
                    clientName
                        ? `${clientName} — cadastro de usuários`
                        : "Cadastro de usuários do cliente"
                }
                description="Gere o link público para este cliente e acompanhe as solicitações recebidas pelo formulário."
            />
            <section className="space-y-3">
                <h2 className="text-sm font-medium">Link público de cadastro</h2>
                <CompanyClientRegistrationLinksPanel
                    clientId={clientId}
                    initialLinks={links}
                />
            </section>
            <section className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-sm font-medium">
                        Solicitações recebidas
                    </h2>
                    <SyncAllProgressModal
                        variant="company"
                        companyClientId={clientId}
                    />
                </div>
                <RegistrationsReviewBoard
                    variant="company"
                    companyClientId={clientId}
                    initialRows={rows}
                />
            </section>
        </div>
    );
}
