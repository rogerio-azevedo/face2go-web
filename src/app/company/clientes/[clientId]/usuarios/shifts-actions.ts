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
    createShiftSchema,
    updateShiftSchema,
} from "@/lib/validations/shifts";
import type { ShiftRow } from "@/types/domain";

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

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
    const out = { ...obj };
    for (const k of Object.keys(out)) {
        if (out[k] === undefined) {
            delete out[k];
        }
    }
    return out;
}

export async function listShiftsAction(
    clientId: string,
): Promise<{ success: true; items: ShiftRow[] } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };

        const res = await apiFetchAuthed(`/api/clients/${clientId}/shifts`);
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items = (await parseResponseJson(res)) as ShiftRow[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createShiftAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };

        const parsed = createShiftSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const res = await apiFetchAuthed(`/api/clients/${clientId}/shifts`, {
            method: "POST",
            body: JSON.stringify(parsed.data),
        });
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

export async function updateShiftAction(
    clientId: string,
    shiftId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const sid = z.string().uuid().safeParse(shiftId);
        if (!cid.success || !sid.success)
            return { error: "Dados inválidos." };

        const parsed = updateShiftSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const d = parsed.data;
        if (
            d.name === undefined &&
            d.schedule === undefined &&
            d.isActive === undefined
        ) {
            return { error: "Nada para atualizar." };
        }

        const body = stripUndefined({ ...d });

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/shifts/${shiftId}`,
            { method: "PATCH", body: JSON.stringify(body) },
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

export async function removeShiftAction(
    clientId: string,
    shiftId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const cid = ids.safeParse({ clientId });
        const sid = z.string().uuid().safeParse(shiftId);
        if (!cid.success || !sid.success)
            return { error: "Dados inválidos." };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/shifts/${shiftId}`,
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
