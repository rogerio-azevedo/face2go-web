"use server";

import { z } from "zod";

import type { ActionResult } from "@/lib/actions/action-result";
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";
import type {
    DeviceSyncJobList,
    DeviceSyncJobSummary,
    DeviceSyncStatusFilter,
} from "@/features/device-sync/types";

const uuid = z.string().uuid();

function basePath(clientId: string): string | null {
    const parsed = uuid.safeParse(clientId);
    return parsed.success
        ? `/api/clients/${parsed.data}/device-sync-jobs`
        : null;
}

async function request<T>(
    path: string | null,
    init?: RequestInit,
): Promise<ActionResult<T>> {
    if (!path) return { ok: false, error: "Cliente inválido." };
    try {
        const res = await apiFetchAuthed(path, init);
        const data = await parseResponseJson(res);
        if (!res.ok) return { ok: false, error: nestErrorMessage(data) };
        return { ok: true, data: data as T };
    } catch {
        return { ok: false, error: "Falha ao falar com a API." };
    }
}

export async function listDeviceSyncJobsAction(
    clientId: string,
    params: { status: DeviceSyncStatusFilter; page: number },
): Promise<ActionResult<DeviceSyncJobList>> {
    const base = basePath(clientId);
    const qs = new URLSearchParams({ page: String(params.page) });
    if (params.status !== "all") qs.set("status", params.status);
    return request<DeviceSyncJobList>(base && `${base}?${qs}`);
}

export async function getDeviceSyncSummaryAction(
    clientId: string,
): Promise<ActionResult<DeviceSyncJobSummary>> {
    const base = basePath(clientId);
    return request<DeviceSyncJobSummary>(base && `${base}/summary`);
}

export async function cancelDeviceSyncJobAction(
    clientId: string,
    jobId: string,
): Promise<ActionResult<{ result: "canceled" | "cancel_requested" }>> {
    const base = basePath(clientId);
    if (!uuid.safeParse(jobId).success) {
        return { ok: false, error: "Job inválido." };
    }
    return request(base && `${base}/${jobId}/cancel`, { method: "POST" });
}

export async function retryDeviceSyncJobAction(
    clientId: string,
    jobId: string,
): Promise<ActionResult<{ jobId: string }>> {
    const base = basePath(clientId);
    if (!uuid.safeParse(jobId).success) {
        return { ok: false, error: "Job inválido." };
    }
    return request(base && `${base}/${jobId}/retry`, { method: "POST" });
}

export async function cancelQueuedDeviceSyncJobsAction(
    clientId: string,
): Promise<ActionResult<{ canceled: number }>> {
    const base = basePath(clientId);
    return request(base && `${base}/cancel-queued`, { method: "POST" });
}
