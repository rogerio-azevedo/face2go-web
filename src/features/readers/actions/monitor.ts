"use server";

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import type { ReadersMonitorStatusResponse } from "@/types/domain";

export async function fetchClientReadersMonitorStatusAction(): Promise<
    | { ok: true; data: ReadersMonitorStatusResponse }
    | { ok: false; error: string }
> {
    try {
        const res = await apiFetchAuthed("/api/client/readers/monitor/status");
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as ReadersMonitorStatusResponse;
        return { ok: true, data };
    } catch {
        return { ok: false, error: "Sem permissão." };
    }
}
