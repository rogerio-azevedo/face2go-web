"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ZodError } from "zod";

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import { vehicleUpsertSchema } from "@/lib/validations/vehicles";
import type { VehicleDriverOptionRow, VehicleRow } from "@/types/domain";

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

export async function listClientVehiclesAction(
    clientId: string,
): Promise<{ success: true; items: VehicleRow[] } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/vehicles`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items = (await parseResponseJson(res)) as VehicleRow[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function listClientVehicleDriverOptionsAction(
    clientId: string,
): Promise<
    | { success: true; items: VehicleDriverOptionRow[] }
    | { error: string }
> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };
        const res = await apiFetchAuthed(
            `/api/clients/${c.data.clientId}/vehicles/driver-options`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const items = (await parseResponseJson(res)) as VehicleDriverOptionRow[];
        return {
            success: true,
            items: Array.isArray(items) ? items : [],
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createClientVehicleAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true; row: VehicleRow } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        if (!c.success) return { error: "Cliente inválido." };

        const parsed = vehicleUpsertSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/vehicles`,
            {
                method: "POST",
                body: JSON.stringify(parsed.data),
            },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const row = (await parseResponseJson(res)) as VehicleRow;
        revalidateSchoolRoutes(clientId);
        return { success: true, row };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function updateClientVehicleAction(
    clientId: string,
    vehicleId: string,
    input: unknown,
): Promise<{ success: true; row: VehicleRow } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        const vid = z.string().uuid().safeParse(vehicleId);
        if (!c.success || !vid.success) return { error: "Dados inválidos." };

        const parsed = vehicleUpsertSchema.safeParse(input);
        if (!parsed.success)
            return { error: zodFirstMessage(parsed.error) };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/vehicles/${vid.data}`,
            {
                method: "PATCH",
                body: JSON.stringify(parsed.data),
            },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const row = (await parseResponseJson(res)) as VehicleRow;
        revalidateSchoolRoutes(clientId);
        return { success: true, row };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function deleteClientVehicleAction(
    clientId: string,
    vehicleId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const c = ids.safeParse({ clientId });
        const vid = z.string().uuid().safeParse(vehicleId);
        if (!c.success || !vid.success) return { error: "Dados inválidos." };

        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/vehicles/${vid.data}`,
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
