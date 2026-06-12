"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import type { InviteRow } from "@/types/domain";

const clientIdSchema = z.string().uuid();

function revalidateSchoolRoutes(clientId: string) {
    revalidatePath("/company/clientes");
    revalidatePath(`/company/clientes/${clientId}/usuarios`);
}

export async function listInvitesAction(
    clientId: string,
): Promise<{ success: true; items: InviteRow[] } | { error: string }> {
    try {
        const c = clientIdSchema.safeParse(clientId);
        if (!c.success) {
            return { error: "Cliente inválido." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data}/invites`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items = (await parseResponseJson(res)) as InviteRow[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function markUsedInviteAction(
    clientId: string,
    inviteId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = clientIdSchema.safeParse(clientId);
        const id = z.string().uuid().safeParse(inviteId);
        if (!c.success || !id.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data}/invites/${id.data}/mark-used`,
            { method: "PATCH" },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function cancelInviteAction(
    clientId: string,
    inviteId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = clientIdSchema.safeParse(clientId);
        const id = z.string().uuid().safeParse(inviteId);
        if (!c.success || !id.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data}/invites/${id.data}/cancel`,
            { method: "PATCH" },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function deleteInviteAction(
    clientId: string,
    inviteId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = clientIdSchema.safeParse(clientId);
        const id = z.string().uuid().safeParse(inviteId);
        if (!c.success || !id.success) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${c.data}/invites/${id.data}`,
            { method: "DELETE" },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        revalidateSchoolRoutes(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}
