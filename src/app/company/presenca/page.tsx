import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { PresenceDashboard } from "@/features/presence/components/PresenceDashboard";
import { apiFetchAuthed } from "@/lib/api-fetch";
import { can } from "@/lib/permissions";
import type {
    ClientListRow,
    CompanyPresenceResponse,
    SchoolPresenceResponse,
} from "@/types/domain";

type PageProps = {
    searchParams: Promise<{ clientId?: string }>;
};

export default async function CompanyPresencePage({ searchParams }: PageProps) {
    const session = await auth();
    const user = session?.user;
    const params = await searchParams;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const role = user.role;
    const canAccess =
        role === "company_admin" ||
        (role === "company_operator" && (await can("presence", "can_read")));

    if (!canAccess) {
        redirect("/company/dashboard");
    }

    const canManageEmergency =
        role === "company_admin" ||
        (role === "company_operator" && (await can("presence", "can_update")));

    const selectedClientId = params.clientId ?? "all";

    let clients: ClientListRow[] = [];
    let companyPresence: CompanyPresenceResponse | null = null;
    let schoolPresence: SchoolPresenceResponse | null = null;
    let loadError: string | null = null;

    try {
        const clientsRes = await apiFetchAuthed("/api/clients");
        if (clientsRes.ok) {
            clients = (await clientsRes.json()) as ClientListRow[];
        }

        if (selectedClientId !== "all") {
            const res = await apiFetchAuthed(
                `/api/clients/${selectedClientId}/presence`,
            );
            if (res.ok) {
                schoolPresence = (await res.json()) as SchoolPresenceResponse;
            } else {
                const body = (await res.json().catch(() => null)) as {
                    message?: string;
                } | null;
                loadError =
                    body?.message ??
                    "Não foi possível carregar a presença desta escola.";
            }
        } else {
            const res = await apiFetchAuthed(
                `/api/companies/${user.companyId}/presence`,
            );
            if (res.ok) {
                companyPresence = (await res.json()) as CompanyPresenceResponse;
            } else {
                const body = (await res.json().catch(() => null)) as {
                    message?: string;
                } | null;
                loadError =
                    body?.message ??
                    "Não foi possível carregar a presença da empresa.";
            }
        }
    } catch {
        clients = [];
        loadError = "Erro de conexão com a API.";
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Presença"
                description="Contagem em tempo real de quem está dentro de cada escola — baseada nos leitores faciais e câmeras LPR."
            />
            <PresenceDashboard
                clients={clients}
                selectedClientId={selectedClientId}
                companyId={user.companyId}
                companyPresence={companyPresence}
                schoolPresence={schoolPresence}
                canManageEmergency={canManageEmergency}
                loadError={loadError}
            />
        </div>
    );
}
