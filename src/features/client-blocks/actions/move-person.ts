"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zodFirstMessage } from "@/lib/actions/zod-utils";
import { apiFetchAuthed, nestErrorMessage, parseResponseJson } from "@/lib/api-fetch";
import type { MoveLocationPersonInput } from "../types";
import { moveLocationPersonSchema } from "../validations";

export async function moveLocationPersonAction(clientId: string, input: MoveLocationPersonInput): Promise<{ success: true } | { error: string }> {
    if (!z.string().uuid().safeParse(clientId).success) return { error: "Cliente inválido." };
    const parsed = moveLocationPersonSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };
    try {
        const res = await apiFetchAuthed(`/api/condominiums/location-review/clients/${clientId}/move-person`, {
            method: "POST", body: JSON.stringify(parsed.data),
        });
        if (!res.ok) return { error: nestErrorMessage(await parseResponseJson(res)) };
        revalidatePath(`/company/clientes/${clientId}/usuarios`);
        revalidatePath("/client/cadastros");
        return { success: true as const };
    } catch {
        return { error: "Não foi possível salvar a alteração. Tente novamente." };
    }
}
