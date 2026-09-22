"use server";

import { z } from "zod";

import { zodFirstMessage } from "@/lib/actions/zod-utils";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

export type RevealedReaderCredentials = {
    readerId: string;
    username: string | null;
    password: string;
};

export async function revealReaderPasswordAction(
    readerId: string,
): Promise<
    { ok: true; password: string; username: string | null } | { ok: false; error: string }
> {
    const parsed = z.string().uuid("Leitor inválido.").safeParse(readerId);
    if (!parsed.success) {
        return { ok: false, error: zodFirstMessage(parsed.error) };
    }
    try {
        const res = await apiFetchAuthed(
            `/api/readers/${parsed.data}/credentials/reveal`,
            { method: "POST" },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await parseResponseJson(res)) as RevealedReaderCredentials;
        return {
            ok: true,
            password: data.password,
            username: data.username ?? null,
        };
    } catch {
        return { ok: false, error: "Não foi possível revelar a senha." };
    }
}
