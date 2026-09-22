"use server";

import { z } from "zod";

import { zodFirstMessage } from "@/lib/actions/zod-utils";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

async function postOpenDoor(
    path: string,
    readerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    const parsed = z.string().uuid("Leitor inválido.").safeParse(readerId);
    if (!parsed.success) {
        return { ok: false, error: zodFirstMessage(parsed.error) };
    }
    try {
        const res = await apiFetchAuthed(path, { method: "POST" });
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        return { ok: true };
    } catch {
        return { ok: false, error: "Não foi possível acionar o leitor." };
    }
}

export async function openReaderDoorAction(
    readerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    return postOpenDoor(`/api/readers/${readerId}/open`, readerId);
}

export async function openClientReaderDoorAction(
    readerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    return postOpenDoor(`/api/client/readers/${readerId}/open`, readerId);
}
