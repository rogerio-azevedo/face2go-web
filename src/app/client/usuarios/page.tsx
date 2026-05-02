import { redirect } from "next/navigation";

import { ClientRegistrationLinksPanel } from "@/components/client/ClientRegistrationLinksPanel";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { auth } from "@/auth";
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
            <section className="space-y-3">
                <h2 className="text-sm font-medium">Links de cadastro</h2>
                <ClientRegistrationLinksPanel initialLinks={links} />
            </section>
            <section className="space-y-3">
                <h2 className="text-sm font-medium">Solicitações recebidas</h2>
                <RegistrationsReviewBoard
                    variant="client"
                    initialRows={registrations}
                />
            </section>
        </div>
    );
}
