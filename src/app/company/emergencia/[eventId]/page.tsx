import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { EmergencyWorkspace } from "@/features/presence/components/EmergencyWorkspace";
import { apiFetchAuthed } from "@/lib/api-fetch";
import { can } from "@/lib/permissions";
import type { EmergencyEventResponse } from "@/types/domain";

type PageProps = {
    params: Promise<{ eventId: string }>;
};

export default async function EmergencyEventPage({ params }: PageProps) {
    const session = await auth();
    const user = session?.user;
    const { eventId } = await params;

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

    const canManage =
        role === "company_admin" ||
        (role === "company_operator" && (await can("presence", "can_update")));

    let event: EmergencyEventResponse | null = null;
    try {
        const res = await apiFetchAuthed(`/api/emergency-events/${eventId}`);
        if (res.ok) {
            event = (await res.json()) as EmergencyEventResponse;
        }
    } catch {
        event = null;
    }

    if (!event) {
        notFound();
    }

    return <EmergencyWorkspace initialEvent={event} canManage={canManage} />;
}
