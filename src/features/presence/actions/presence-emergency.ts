"use server";

import { revalidatePath } from "next/cache";

import { apiFetchAuthed } from "@/lib/api-fetch";
import type {
    EmergencyEventResponse,
    SchoolPresenceResponse,
} from "@/types/domain";

export async function activateEmergencyAction(
    clientId: string,
    input: {
        srpAction?: string;
        reason?: string;
    },
): Promise<{ ok: true; data: EmergencyEventResponse } | { ok: false; error: string }> {
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/emergency-events`,
            {
                method: "POST",
                body: JSON.stringify(input),
            },
        );
        if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
                message?: string;
            } | null;
            return {
                ok: false,
                error: body?.message ?? "Não foi possível ativar o modo emergência.",
            };
        }
        const data = (await res.json()) as EmergencyEventResponse;
        revalidatePath("/company/presenca");
        return { ok: true, data };
    } catch {
        return { ok: false, error: "Erro de conexão com a API." };
    }
}

export async function updateEmergencyCheckinAction(
    eventId: string,
    checkinId: string,
    input: { status: string; note?: string },
): Promise<{ ok: true; data: EmergencyEventResponse } | { ok: false; error: string }> {
    try {
        const res = await apiFetchAuthed(
            `/api/emergency-events/${eventId}/checkins/${checkinId}`,
            {
                method: "PATCH",
                body: JSON.stringify(input),
            },
        );
        if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
                message?: string;
            } | null;
            return {
                ok: false,
                error: body?.message ?? "Não foi possível atualizar a chamada.",
            };
        }
        return { ok: true, data: (await res.json()) as EmergencyEventResponse };
    } catch {
        return { ok: false, error: "Erro de conexão com a API." };
    }
}

export async function resolveEmergencyAction(
    eventId: string,
    note?: string,
): Promise<{ ok: true; data: EmergencyEventResponse } | { ok: false; error: string }> {
    try {
        const res = await apiFetchAuthed(
            `/api/emergency-events/${eventId}/resolve`,
            {
                method: "PATCH",
                body: JSON.stringify({ note }),
            },
        );
        if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
                message?: string;
            } | null;
            return {
                ok: false,
                error: body?.message ?? "Não foi possível encerrar a emergência.",
            };
        }
        revalidatePath("/company/presenca");
        return { ok: true, data: (await res.json()) as EmergencyEventResponse };
    } catch {
        return { ok: false, error: "Erro de conexão com a API." };
    }
}

export async function fetchSchoolPresenceAction(
    clientId: string,
): Promise<SchoolPresenceResponse | null> {
    try {
        const res = await apiFetchAuthed(`/api/clients/${clientId}/presence`);
        if (!res.ok) return null;
        return (await res.json()) as SchoolPresenceResponse;
    } catch {
        return null;
    }
}

export async function fetchEmergencyEventAction(
    eventId: string,
): Promise<EmergencyEventResponse | null> {
    try {
        const res = await apiFetchAuthed(`/api/emergency-events/${eventId}`);
        if (!res.ok) return null;
        return (await res.json()) as EmergencyEventResponse;
    } catch {
        return null;
    }
}
