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
