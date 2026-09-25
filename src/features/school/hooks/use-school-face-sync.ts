"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import {
    getSchoolFaceSyncStatusAction,
    type SchoolFaceSyncJob,
} from "@/features/school/actions/face-sync";

export function useSchoolFaceSync(
    clientId: string,
    onFinished?: (job: SchoolFaceSyncJob | null) => void,
) {
    const query = useQuery({
        queryKey: ["school-face-sync", clientId],
        queryFn: async () => {
            const result = await getSchoolFaceSyncStatusAction(clientId);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        enabled: Boolean(clientId),
        refetchInterval: 2500,
    });

    const jobs = query.data?.jobs ?? [];
    const activeJob = jobs[0] ?? null;
    const syncBusy = jobs.length > 0;
    const prevBusy = useRef(false);
    const lastJob = useRef<SchoolFaceSyncJob | null>(null);

    useEffect(() => {
        if (activeJob) lastJob.current = activeJob;
        if (prevBusy.current && !syncBusy) {
            onFinished?.(lastJob.current);
        }
        prevBusy.current = syncBusy;
    }, [activeJob, onFinished, syncBusy]);

    return { ...query, jobs, activeJob, syncBusy };
}
