export type FaceSyncStatusFields = {
    deviceSyncStatus: string;
    deviceSyncError: string | null;
};

export function isFaceSyncPending(status: string): boolean {
    return status === "pending_sync" || status === "";
}

export function isPartialSyncError(error: string | null | undefined): boolean {
    return error?.toLowerCase().includes("parcialmente") ?? false;
}

const FALLBACK_SYNC_ERROR = "Falha na sincronização. Tente de novo.";

/** Textos técnicos já persistidos em `device_sync_error` (gateway / env). */
export function humanizeDeviceSyncError(
    error: string | null | undefined,
): string {
    if (error == null) return "";
    const t = error.trim();
    if (!t) return "";
    return t
        .replace(
            /Leitor(?: Hikvision)? em registro automático sem (?:READER_GATEWAY_URL\/READER_GATEWAY_TOKEN|HIK_GATEWAY_URL\/HIK_GATEWAY_TOKEN)/gi,
            "O leitor está em registro automático, mas o gateway não está configurado.",
        )
        .replace(
            /Leitor(?: Hikvision)? em registro automático sem (?:ID de dispositivo|ID EHome)/gi,
            "O leitor está em registro automático sem ID de dispositivo.",
        )
        .trim();
}

export function deviceSyncFailureMessage(
    error: string | null | undefined,
): string {
    return humanizeDeviceSyncError(error) || FALLBACK_SYNC_ERROR;
}

/** Fração `synced/total` de leitores, ou null se ainda não dá para mostrar. */
export function readerSyncFraction(
    synced: number | null | undefined,
    total: number | null | undefined,
): string | null {
    if (synced == null || total == null || total <= 0) return null;
    return `${synced}/${total}`;
}

/** POST de cadastro pode devolver job DTO (`queued`) ou `deviceSyncStatus`. */
export function parseRegistrationFaceSyncEnqueue(data: {
    deviceSyncStatus?: string;
    deviceSyncError?: string | null;
    jobId?: string;
    status?: string;
}): FaceSyncStatusFields {
    if (
        typeof data.deviceSyncStatus === "string" &&
        data.deviceSyncStatus.length > 0
    ) {
        return {
            deviceSyncStatus: data.deviceSyncStatus,
            deviceSyncError: data.deviceSyncError ?? null,
        };
    }
    if (
        data.jobId &&
        (data.status === "queued" ||
            data.status === "running" ||
            data.status == null ||
            data.status === "")
    ) {
        return { deviceSyncStatus: "pending_sync", deviceSyncError: null };
    }
    return {
        deviceSyncStatus: "pending_sync",
        deviceSyncError: data.deviceSyncError ?? null,
    };
}
