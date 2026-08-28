export type FaceSyncOutcome = "success" | "partial" | "failed";

export type FaceSyncStatusFields = {
    deviceSyncStatus: string;
    deviceSyncError: string | null;
};

const FACE_SYNC_POLL_INTERVAL_MS = 2500;
const FACE_SYNC_POLL_TIMEOUT_MS = 180_000;

export function isFaceSyncPending(status: string): boolean {
    return status === "pending_sync" || status === "";
}

export function isPartialSyncError(error: string | null | undefined): boolean {
    return error?.toLowerCase().includes("parcialmente") ?? false;
}

export function parseFaceSyncOutcome(
    status: string,
    error: string | null,
): FaceSyncOutcome {
    if (isFaceSyncPending(status)) return "failed";
    if (status === "synced" && error === null) return "success";
    if (status === "synced" && isPartialSyncError(error)) return "partial";
    return "failed";
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isFatalFaceSyncPollError(message: string): boolean {
    return /permiss[aã]o|autenticado|inv[aá]lido/i.test(message);
}

/** A API enfileira o sync e responde `pending_sync` na hora — espera o status final. */
export async function waitForFaceSyncSettled(
    fetchStatus: () => Promise<FaceSyncStatusFields | { error: string }>,
): Promise<FaceSyncStatusFields | { error: string }> {
    const deadline = Date.now() + FACE_SYNC_POLL_TIMEOUT_MS;
    let lastError: string | null = null;

    while (Date.now() < deadline) {
        const next = await fetchStatus();
        if ("deviceSyncStatus" in next) {
            if (!isFaceSyncPending(next.deviceSyncStatus)) {
                return {
                    deviceSyncStatus: next.deviceSyncStatus,
                    deviceSyncError: next.deviceSyncError,
                };
            }
        } else {
            if (isFatalFaceSyncPollError(next.error)) return next;
            lastError = next.error;
        }

        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        await sleep(Math.min(FACE_SYNC_POLL_INTERVAL_MS, remaining));
    }

    if (lastError) return { error: lastError };
    return {
        deviceSyncStatus: "pending_sync",
        deviceSyncError:
            "A sincronização ainda está em andamento. Atualize a lista em instantes.",
    };
}

/** Remove ruído técnico de mensagens gravadas pelo backend. */
export function humanizeDeviceSyncError(
    detail: string | null | undefined,
): string {
    if (detail == null || detail.trim() === "") {
        return "Não foi possível sincronizar com os leitores.";
    }

    const t = detail
        .replace(/\bRequest failed with status code 400\b/gi, "")
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

    if (/timeout|timed out|offline|inacessível|inacessivel|econnrefused|etimedout/i.test(t)) {
        return "Um ou mais leitores estão offline ou inacessíveis no momento.";
    }

    return t || "Não foi possível sincronizar com os leitores.";
}

export const FACE_SYNC_STEPS = [
    "Verificando foto…",
    "Enviando zona de horário aos leitores…",
    "Atualizando cartão de acesso…",
    "Enviando foto facial…",
] as const;
