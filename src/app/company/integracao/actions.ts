"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
    apiFetchAuthed,
    getApiBaseUrl,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import type { IenhFilialMappingRow, IenhSnapshotInfo } from "@/types/domain";

export async function fetchIenhFilialMappingsAction(): Promise<
    { mappings: IenhFilialMappingRow[] } | { error: string }
> {
    try {
        const res = await apiFetchAuthed("/api/ienh/filial-mappings");
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const mappings = (await res.json()) as IenhFilialMappingRow[];
        return { mappings };
    } catch {
        return { error: "Sem permissão ou falha de rede." };
    }
}

export async function setIenhFilialMappingAction(
    filialCode: number,
    clientId: string | null,
): Promise<{ mappings: IenhFilialMappingRow[] } | { error: string }> {
    try {
        const res = await apiFetchAuthed("/api/ienh/filial-mappings", {
            method: "PUT",
            body: JSON.stringify({ filialCode, clientId }),
        });
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const mappings = (await res.json()) as IenhFilialMappingRow[];
        revalidatePath("/company/integracao");
        return { mappings };
    } catch {
        return { error: "Sem permissão ou falha de rede." };
    }
}

export async function fetchIenhSnapshotsAction(): Promise<
    { snapshots: IenhSnapshotInfo[] } | { error: string }
> {
    try {
        const res = await apiFetchAuthed("/api/ienh/snapshots");
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const snapshots = (await res.json()) as IenhSnapshotInfo[];
        return { snapshots };
    } catch {
        return { error: "Sem permissão ou falha de rede." };
    }
}

export async function getIenhSyncSseUrlAction(
    perlet?: string,
): Promise<{ url: string } | { error: string }> {
    try {
        const session = await auth();
        const token = session?.accessToken;
        if (!token) {
            return { error: "Não autenticado." };
        }
        const base = getApiBaseUrl();
        const params = new URLSearchParams({
            token,
        });
        const trimmed = perlet?.trim();
        if (trimmed) {
            params.set("perlet", trimmed);
        }
        const url = `${base}/api/ienh/sync/progress?${params.toString()}`;
        return { url };
    } catch {
        return { error: "Não autenticado." };
    }
}

export async function getIenhSyncFromSnapshotSseUrlAction(
    file: string,
): Promise<{ url: string } | { error: string }> {
    try {
        const session = await auth();
        const token = session?.accessToken;
        if (!token) {
            return { error: "Não autenticado." };
        }
        const base = getApiBaseUrl();
        const params = new URLSearchParams({
            token,
            file: file.trim(),
        });
        const url = `${base}/api/ienh/sync/progress/from-snapshot?${params.toString()}`;
        return { url };
    } catch {
        return { error: "Não autenticado." };
    }
}
