import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CamerasTable } from "@/components/company/cameras/CamerasTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetchAuthed } from "@/lib/api-fetch";
import { can } from "@/lib/permissions";
import type { CameraListRow, ClientListRow } from "@/types/domain";

export default async function CompanyCamerasPage() {
    const session = await auth();
    const user = session?.user;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const role = user.role;
    const canAccess =
        role === "company_admin" ||
        (role === "company_operator" && (await can("clients", "can_read")));

    if (!canAccess) {
        redirect("/company/dashboard");
    }

    const canManage = role === "company_admin";

    let cameras: CameraListRow[] = [];
    let clients: ClientListRow[] = [];

    try {
        const [camerasRes, clientsRes] = await Promise.all([
            apiFetchAuthed("/api/cameras"),
            apiFetchAuthed("/api/clients"),
        ]);

        if (camerasRes.ok) {
            cameras = (await camerasRes.json()) as CameraListRow[];
        }
        if (clientsRes.ok) {
            clients = (await clientsRes.json()) as ClientListRow[];
        }
    } catch {
        cameras = [];
        clients = [];
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Câmeras"
                description="Cadastro de câmeras (LPR Intelbras e demais tipos) vinculadas aos clientes da empresa."
            />
            <CamerasTable
                cameras={cameras}
                clients={clients}
                canManage={canManage}
            />
        </div>
    );
}
