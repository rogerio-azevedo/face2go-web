"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { zodFirstMessage } from "@/lib/actions/zod-utils";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

import type { CatalogBlock } from "./types";
import {
    blockNameSchema,
    generateUnitsSchema,
    unitNameSchema,
} from "./validations";

const clientIdSchema = z.string().uuid();
const idSchema = z.string().uuid();

function revalidateBlocks(clientId: string) {
    revalidatePath("/client/cadastros");
    revalidatePath(`/company/clientes/${clientId}/usuarios`);
}

async function readError(res: Response) {
    const data = await parseResponseJson(res);
    return nestErrorMessage(data);
}

export async function listClientBlocksAction(
    clientId: string,
): Promise<{ success: true; items: CatalogBlock[] } | { error: string }> {
    try {
        const parsed = clientIdSchema.safeParse(clientId);
        if (!parsed.success) return { error: "Cliente inválido." };
        const res = await apiFetchAuthed(
            `/api/clients/${parsed.data}/blocks`,
        );
        if (!res.ok) return { error: await readError(res) };
        const items = (await parseResponseJson(res)) as CatalogBlock[];
        return { success: true, items: Array.isArray(items) ? items : [] };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createClientBlockAction(
    clientId: string,
    name: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsedId = clientIdSchema.safeParse(clientId);
        const parsedName = blockNameSchema.safeParse(name);
        if (!parsedId.success) return { error: "Cliente inválido." };
        if (!parsedName.success) {
            return { error: zodFirstMessage(parsedName.error) };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${parsedId.data}/blocks`,
            {
                method: "POST",
                body: JSON.stringify({ name: parsedName.data }),
            },
        );
        if (!res.ok) return { error: await readError(res) };
        revalidateBlocks(parsedId.data);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function updateClientBlockAction(
    clientId: string,
    blockId: string,
    input: { name?: string; isActive?: boolean },
): Promise<{ success: true } | { error: string }> {
    try {
        if (!clientIdSchema.safeParse(clientId).success) {
            return { error: "Cliente inválido." };
        }
        if (!idSchema.safeParse(blockId).success) {
            return { error: "Bloco inválido." };
        }
        if (input.name !== undefined) {
            const parsedName = blockNameSchema.safeParse(input.name);
            if (!parsedName.success) {
                return { error: zodFirstMessage(parsedName.error) };
            }
            input = { ...input, name: parsedName.data };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/blocks/${blockId}`,
            { method: "PATCH", body: JSON.stringify(input) },
        );
        if (!res.ok) return { error: await readError(res) };
        revalidateBlocks(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function createClientUnitAction(
    clientId: string,
    blockId: string,
    name: string,
): Promise<{ success: true } | { error: string }> {
    try {
        if (
            !clientIdSchema.safeParse(clientId).success ||
            !idSchema.safeParse(blockId).success
        ) {
            return { error: "Dados inválidos." };
        }
        const parsedName = unitNameSchema.safeParse(name);
        if (!parsedName.success) {
            return { error: zodFirstMessage(parsedName.error) };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/blocks/${blockId}/units`,
            {
                method: "POST",
                body: JSON.stringify({ name: parsedName.data }),
            },
        );
        if (!res.ok) return { error: await readError(res) };
        revalidateBlocks(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function generateClientUnitsAction(
    clientId: string,
    blockId: string,
    input: { start: number; end: number },
): Promise<
    { success: true; created: number; skipped: number } | { error: string }
> {
    try {
        if (
            !clientIdSchema.safeParse(clientId).success ||
            !idSchema.safeParse(blockId).success
        ) {
            return { error: "Dados inválidos." };
        }
        const parsed = generateUnitsSchema.safeParse(input);
        if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/blocks/${blockId}/units/generate`,
            { method: "POST", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) return { error: await readError(res) };
        const body = (await parseResponseJson(res)) as {
            created?: number;
            skipped?: number;
        };
        revalidateBlocks(clientId);
        return {
            success: true,
            created: body.created ?? 0,
            skipped: body.skipped ?? 0,
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function updateClientUnitAction(
    clientId: string,
    unitId: string,
    input: { name?: string; isActive?: boolean },
): Promise<{ success: true } | { error: string }> {
    try {
        if (
            !clientIdSchema.safeParse(clientId).success ||
            !idSchema.safeParse(unitId).success
        ) {
            return { error: "Dados inválidos." };
        }
        if (input.name !== undefined) {
            const parsedName = unitNameSchema.safeParse(input.name);
            if (!parsedName.success) {
                return { error: zodFirstMessage(parsedName.error) };
            }
            input = { ...input, name: parsedName.data };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/units/${unitId}`,
            { method: "PATCH", body: JSON.stringify(input) },
        );
        if (!res.ok) return { error: await readError(res) };
        revalidateBlocks(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function mergeClientUnitAction(
    clientId: string,
    sourceUnitId: string,
    targetUnitId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        if (
            !clientIdSchema.safeParse(clientId).success ||
            !idSchema.safeParse(sourceUnitId).success ||
            !idSchema.safeParse(targetUnitId).success
        ) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/units/${sourceUnitId}/merge`,
            {
                method: "POST",
                body: JSON.stringify({ targetUnitId }),
            },
        );
        if (!res.ok) return { error: await readError(res) };
        revalidateBlocks(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}
