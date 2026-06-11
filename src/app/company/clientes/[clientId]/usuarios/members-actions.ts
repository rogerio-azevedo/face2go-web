"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ZodError } from "zod";

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import {
    buildSchoolListQuery,
    normalizePaginated,
    type SchoolListParams,
} from "@/lib/pagination";
import {
    createMemberSchema,
    updateMemberSchema,
} from "@/lib/validations/members";
import type { ClientRoleRow, MemberRow, PaginatedResponse } from "@/types/domain";

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return "Dados inválidos.";
}

function revalidateSchoolRoutes(clientId: string) {
    revalidatePath("/company/clientes");
    revalidatePath(`/company/clientes/${clientId}/usuarios`);
}

const ids = z.object({
    clientId: z.string().uuid(),
});

export async function listClientRolesAction(
    clientId: string,
): Promise<
    | { success: true; items: ClientRoleRow[] }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/roles`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items = (await parseResponseJson(res)) as ClientRoleRow[];
        return { success: true, items };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function listMembersAction(
    clientId: string,
    params: SchoolListParams & { roleId?: string } = {},
): Promise<
    | { success: true; result: PaginatedResponse<MemberRow> }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const qs = buildSchoolListQuery(params);
        const roleQs = params.roleId
            ? `${qs ? `${qs}&` : ""}roleId=${encodeURIComponent(params.roleId)}`
            : qs;
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/members?${roleQs}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const parsed = await parseResponseJson(res);
        return {
            success: true,
            result: normalizePaginated<MemberRow>(parsed),
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createMemberAction(
    clientId: string,
    body: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const parsed = createMemberSchema.safeParse(body);
        if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/members`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            },
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

export async function updateMemberAction(
    clientId: string,
    memberId: string,
    body: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = z.string().uuid().safeParse(clientId);
        const mid = z.string().uuid().safeParse(memberId);
        if (!cid.success || !mid.success) return { error: "ID inválido." };
        const parsed = updateMemberSchema.safeParse(body);
        if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/members/${mid.data}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed.data),
            },
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

export async function deleteMemberAction(
    clientId: string,
    memberId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = z.string().uuid().safeParse(clientId);
        const mid = z.string().uuid().safeParse(memberId);
        if (!cid.success || !mid.success) return { error: "ID inválido." };
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/members/${mid.data}`,
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

export async function syncMemberFaceAction(
    clientId: string,
    memberId: string,
): Promise<
    | {
          success: true;
          deviceSyncStatus: string;
          deviceSyncError: string | null;
      }
    | { error: string }
> {
    const cid = z.string().uuid().safeParse(clientId);
    const mid = z.string().uuid().safeParse(memberId);
    if (!cid.success || !mid.success) return { error: "ID inválido." };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/members/${mid.data}/face/sync`,
            { method: "POST" },
        );
        const data = (await parseResponseJson(res)) as {
            deviceSyncStatus?: string;
            deviceSyncError?: string | null;
        };
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidateSchoolRoutes(clientId);
        return {
            success: true,
            deviceSyncStatus: String(data.deviceSyncStatus ?? ""),
            deviceSyncError: data.deviceSyncError ?? null,
        };
    } catch {
        return { error: "Sem permissão." };
    }
}
