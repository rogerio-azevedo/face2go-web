"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { zodFirstMessage } from "@/lib/actions/zod-utils";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

async function postDoorAction(
    path: string,
    readerId: string,
    fallbackError: string,
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
        revalidatePath("/company/leitores");
        revalidatePath("/client/leitores");
        return { ok: true };
    } catch {
        return { ok: false, error: fallbackError };
    }
}

export async function openReaderDoorAction(
    readerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    return postDoorAction(
        `/api/readers/${readerId}/open`,
        readerId,
        "Não foi possível acionar o leitor.",
    );
}

export async function openClientReaderDoorAction(
    readerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    return postDoorAction(
        `/api/client/readers/${readerId}/open`,
        readerId,
        "Não foi possível acionar o leitor.",
    );
}

export async function setReaderDoorHoldAction(
    readerId: string,
    variant: "company" | "client",
    hold: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
    const prefix =
        variant === "client" ? "/api/client/readers" : "/api/readers";
    const suffix = hold ? "hold-open" : "release";
    return postDoorAction(
        `${prefix}/${readerId}/${suffix}`,
        readerId,
        hold
            ? "Não foi possível manter a porta aberta."
            : "Não foi possível fechar a porta.",
    );
}
