import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientDetailTabs } from "@/components/company/clientes/ClientDetailTabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { can } from "@/lib/permissions";
import { apiFetchAuthed, parseResponseJson } from "@/lib/api-fetch";
import type {
    ClientRegistrationListRow,
    ClientListRow,
    PickupAuthorizationRow,
    RegistrationLinkListRow,
    ResponsibleRow,
    SchoolClassRow,
    ShiftRow,
    StudentRow,
    VehicleRow,
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

    let clientMeta: Pick<ClientListRow, "name" | "type"> | null = null;
    let links: RegistrationLinkListRow[] = [];
    let rows: ClientRegistrationListRow[] = [];
    let schoolClasses: SchoolClassRow[] = [];
    let schoolStudents: StudentRow[] = [];
    let schoolResponsibles: ResponsibleRow[] = [];
    let schoolShifts: ShiftRow[] = [];
    let schoolPickupAuthorizations: PickupAuthorizationRow[] = [];
    let schoolVehicles: VehicleRow[] = [];

    try {
        const clientRes = await apiFetchAuthed(`/api/clients/${clientId}`);
        if (clientRes.ok) {
            const data = (await parseResponseJson(clientRes)) as ClientListRow | null;
            if (data) {
                clientMeta = { name: data.name, type: data.type };
            }
        }

        const [linksRes, regRes] = await Promise.all([
            apiFetchAuthed(`/api/clients/${clientId}/registration-links`),
            apiFetchAuthed(`/api/clients/${clientId}/registrations`),
        ]);

        if (linksRes.ok) {
            links = (await parseResponseJson(linksRes)) as RegistrationLinkListRow[];
        }
        if (regRes.ok) {
            rows = (await parseResponseJson(regRes)) as ClientRegistrationListRow[];
        }

        if (clientMeta?.type === "school") {
            const [clsRes, stRes, prRes, shRes, pkRes, vhRes] =
                await Promise.all([
                    apiFetchAuthed(`/api/clients/${clientId}/school-classes`),
                    apiFetchAuthed(`/api/clients/${clientId}/students`),
                    apiFetchAuthed(`/api/clients/${clientId}/responsibles`),
                    apiFetchAuthed(`/api/clients/${clientId}/shifts`),
                    apiFetchAuthed(
                        `/api/clients/${clientId}/pickup-authorizations`,
                    ),
                    apiFetchAuthed(`/api/clients/${clientId}/vehicles`),
                ]);
            if (clsRes.ok) {
                schoolClasses = (await parseResponseJson(
                    clsRes,
                )) as SchoolClassRow[];
            }
            if (stRes.ok) {
                schoolStudents = (await parseResponseJson(
                    stRes,
                )) as StudentRow[];
            }
            if (prRes.ok) {
                schoolResponsibles = (await parseResponseJson(
                    prRes,
                )) as ResponsibleRow[];
            }
            if (shRes.ok) {
                schoolShifts = (await parseResponseJson(shRes)) as ShiftRow[];
            }
            if (pkRes.ok) {
                schoolPickupAuthorizations =
                    ((await parseResponseJson(
                        pkRes,
                    )) as PickupAuthorizationRow[]) ?? [];
                if (!Array.isArray(schoolPickupAuthorizations)) {
                    schoolPickupAuthorizations = [];
                }
            }
            if (vhRes.ok) {
                const parsed = (await parseResponseJson(vhRes)) as
                    | VehicleRow[]
                    | null;
                schoolVehicles =
                    parsed && Array.isArray(parsed) ? parsed : [];
            }
        }
    } catch {
        links = [];
        rows = [];
        schoolClasses = [];
        schoolStudents = [];
        schoolResponsibles = [];
        schoolShifts = [];
        schoolPickupAuthorizations = [];
        schoolVehicles = [];
    }

    const clientName = clientMeta?.name ?? null;

    return (
        <div className="space-y-8">
            <PageHeader
                title={
                    clientName
                        ? `${clientName} — Gerenciar`
                        : "Gerenciar cliente"
                }
                description={
                    clientMeta?.type === "school"
                        ? "Gerencie horários, turmas, alunos, responsáveis e veículos da escola."
                        : "Cadastro via link e solicitações."
                }
            />
            <ClientDetailTabs
                clientId={clientId}
                clientType={clientMeta?.type ?? "other"}
                initialLinks={links}
                initialRows={rows}
                initialSchoolClasses={schoolClasses}
                initialSchoolStudents={schoolStudents}
                initialSchoolResponsibles={schoolResponsibles}
                initialSchoolShifts={schoolShifts}
                initialSchoolPickupAuthorizations={schoolPickupAuthorizations}
                initialSchoolVehicles={schoolVehicles}
            />
        </div>
    );
}
