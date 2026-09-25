"use client";

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    cancelDeviceSyncJobAction,
    cancelQueuedDeviceSyncJobsAction,
    getDeviceSyncSummaryAction,
    listDeviceSyncJobsAction,
    retryDeviceSyncJobAction,
} from "@/features/device-sync/actions/queue";
import type { DeviceSyncStatusFilter } from "@/features/device-sync/types";
import type { ActionResult } from "@/lib/actions/action-result";

const ACTIVE_POLL_MS = 3000;

function unwrap<T>(result: ActionResult<T>): T {
    if (!result.ok) throw new Error(result.error);
    return result.data as T;
}

export function useDeviceSyncQueue(
    clientId: string,
    filter: { status: DeviceSyncStatusFilter; page: number },
) {
    const qc = useQueryClient();
    const rootKey = ["device-sync-jobs", clientId] as const;

    const summary = useQuery({
        queryKey: [...rootKey, "summary"],
        queryFn: async () => unwrap(await getDeviceSyncSummaryAction(clientId)),
        refetchInterval: (query) => {
            const data = query.state.data;
            return data && data.queued + data.running > 0
                ? ACTIVE_POLL_MS
                : false;
        },
    });

    const active = (summary.data?.queued ?? 0) + (summary.data?.running ?? 0);

    const list = useQuery({
        queryKey: [...rootKey, "list", filter.status, filter.page],
        queryFn: async () =>
            unwrap(await listDeviceSyncJobsAction(clientId, filter)),
        placeholderData: keepPreviousData,
        refetchInterval: active > 0 ? ACTIVE_POLL_MS : false,
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: rootKey });

    const cancel = useMutation({
        mutationFn: async (jobId: string) =>
            unwrap(await cancelDeviceSyncJobAction(clientId, jobId)),
        onSettled: invalidate,
    });

    const retry = useMutation({
        mutationFn: async (jobId: string) =>
            unwrap(await retryDeviceSyncJobAction(clientId, jobId)),
        onSettled: invalidate,
    });

    const cancelQueued = useMutation({
        mutationFn: async () =>
            unwrap(await cancelQueuedDeviceSyncJobsAction(clientId)),
        onSettled: invalidate,
    });

    return { summary, list, cancel, retry, cancelQueued };
}
