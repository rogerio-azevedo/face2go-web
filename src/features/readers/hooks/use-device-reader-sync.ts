"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { getDeviceUsersSyncStatusAction } from "@/app/company/leitores/actions";

export function useDeviceReaderSync(
    readerId: string,
    onFinished?: () => void,
) {
    const query = useQuery({
        queryKey: ["device-reader-sync", readerId],
        queryFn: async () => {
            const result = await getDeviceUsersSyncStatusAction(readerId);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        enabled: Boolean(readerId),
        refetchInterval: 2500,
    });

    const jobs = query.data?.jobs ?? [];
    const activeJob =
        jobs.find((job) => job.targetId === readerId) ?? jobs[0] ?? null;
    const syncBusy = jobs.length > 0;
    const prevBusy = useRef(false);

    useEffect(() => {
        if (prevBusy.current && !syncBusy) {
            onFinished?.();
        }
        prevBusy.current = syncBusy;
    }, [onFinished, syncBusy]);

    return { ...query, jobs, activeJob, syncBusy };
}
