"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { zodFirstMessage } from "@/lib/actions/zod-utils";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

import type {
    CatalogBlock,
    ClientLocationReview,
    LocationReviewPerson,
    MoveLocationGroupsInput,
    UpdateClientBlockInput,
} from "./types";
import {
    bindLocationGroupsSchema,
    blockNameSchema,
    ensureLocationUnitSchema,
    generateStructureSchema,
    generateUnitsSchema,
    type GenerateStructureInput,
    moveLocationGroupsSchema,
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
    input: UpdateClientBlockInput,
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

export async function deleteClientBlockAction(
    clientId: string,
    blockId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        if (
            !clientIdSchema.safeParse(clientId).success ||
            !idSchema.safeParse(blockId).success
        ) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/blocks/${blockId}`,
            { method: "DELETE" },
        );
        if (!res.ok) return { error: await readError(res) };
        revalidateBlocks(clientId);
        return { success: true };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function deleteClientUnitAction(
    clientId: string,
    unitId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        if (
            !clientIdSchema.safeParse(clientId).success ||
            !idSchema.safeParse(unitId).success
        ) {
            return { error: "Dados inválidos." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/units/${unitId}`,
            { method: "DELETE" },
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
    input: { floorStart: number; floorEnd: number; unitsPerFloor: number },
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

export async function generateClientStructureAction(
    clientId: string,
    input: GenerateStructureInput,
): Promise<
    | {
          success: true;
          blocksCreated: number;
          unitsCreated: number;
          unitsSkipped: number;
          inactiveBlocksSkipped: string[];
      }
    | { error: string }
> {
    try {
        if (!clientIdSchema.safeParse(clientId).success) {
            return { error: "Cliente inválido." };
        }
        const parsed = generateStructureSchema.safeParse(input);
        if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/blocks/generate-structure`,
            { method: "POST", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) return { error: await readError(res) };
        const body = (await parseResponseJson(res)) as {
            blocksCreated?: number;
            unitsCreated?: number;
            unitsSkipped?: number;
            inactiveBlocksSkipped?: string[];
        };
        revalidateBlocks(clientId);
        return {
            success: true,
            blocksCreated: body.blocksCreated ?? 0,
            unitsCreated: body.unitsCreated ?? 0,
            unitsSkipped: body.unitsSkipped ?? 0,
            inactiveBlocksSkipped: body.inactiveBlocksSkipped ?? [],
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

export async function getClientLocationReviewAction(
    clientId: string,
): Promise<{ success: true; review: ClientLocationReview } | { error: string }> {
    try {
        const parsed = clientIdSchema.safeParse(clientId);
        if (!parsed.success) return { error: "Cliente inválido." };
        const res = await apiFetchAuthed(
            `/api/condominiums/location-review/clients/${parsed.data}`,
        );
        if (!res.ok) return { error: await readError(res) };
        const review = (await parseResponseJson(res)) as ClientLocationReview;
        return { success: true, review };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function getUnitPeopleAction(
    clientId: string,
    unitId: string,
): Promise<{ success: true; people: LocationReviewPerson[] } | { error: string }> {
    try {
        if (
            !clientIdSchema.safeParse(clientId).success ||
            !idSchema.safeParse(unitId).success
        ) {
            return { error: "Unidade inválida." };
        }
        const res = await apiFetchAuthed(
            `/api/clients/${clientId}/units/${unitId}/people`,
        );
        if (!res.ok) return { error: await readError(res) };
        const people = (await parseResponseJson(res)) as LocationReviewPerson[];
        return { success: true, people };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function ensureLocationUnitAction(
    clientId: string,
    input: { blockName: string; unitName: string },
): Promise<{ success: true; unitId: string } | { error: string }> {
    try {
        if (!clientIdSchema.safeParse(clientId).success) {
            return { error: "Cliente inválido." };
        }
        const parsed = ensureLocationUnitSchema.safeParse(input);
        if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
        const res = await apiFetchAuthed(
            `/api/condominiums/location-review/clients/${clientId}/ensure-unit`,
            { method: "POST", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) return { error: await readError(res) };
        const body = (await parseResponseJson(res)) as { unitId?: string };
        if (!body.unitId) return { error: "Unidade não retornada." };
        revalidateBlocks(clientId);
        return { success: true, unitId: body.unitId };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function bindLocationGroupsAction(
    clientId: string,
    items: { blockText: string; unitText: string; unitId: string }[],
): Promise<
    | { success: true; registrations: number; members: number }
    | { error: string }
> {
    try {
        if (!clientIdSchema.safeParse(clientId).success) {
            return { error: "Cliente inválido." };
        }
        const parsed = bindLocationGroupsSchema.safeParse({ items });
        if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
        const res = await apiFetchAuthed(
            `/api/condominiums/location-review/clients/${clientId}/bind`,
            { method: "POST", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) return { error: await readError(res) };
        const body = (await parseResponseJson(res)) as {
            registrations?: number;
            members?: number;
        };
        revalidateBlocks(clientId);
        return {
            success: true,
            registrations: body.registrations ?? 0,
            members: body.members ?? 0,
        };
    } catch {
        return { error: "Sem permissão." };
    }
}

export async function moveLocationGroupsAction(
    clientId: string,
    items: MoveLocationGroupsInput["items"],
): Promise<
    { success: true; moved: number; unlinked: number } | { error: string }
> {
    try {
        if (!clientIdSchema.safeParse(clientId).success) {
            return { error: "Cliente inválido." };
        }
        const parsed = moveLocationGroupsSchema.safeParse({ items });
        if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
        const res = await apiFetchAuthed(
            `/api/condominiums/location-review/clients/${clientId}/move`,
            { method: "POST", body: JSON.stringify(parsed.data) },
        );
        if (!res.ok) return { error: await readError(res) };
        const body = (await parseResponseJson(res)) as {
            moved?: number;
            unlinked?: number;
        };
        revalidateBlocks(clientId);
        return {
            success: true,
            moved: body.moved ?? 0,
            unlinked: body.unlinked ?? 0,
        };
    } catch {
        return { error: "Sem permissão." };
    }
}
