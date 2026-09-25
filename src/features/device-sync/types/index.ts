import type { components } from "@/types/api.generated";

export type DeviceSyncJobList = components["schemas"]["DeviceSyncJobListDto"];
export type DeviceSyncJobItem = DeviceSyncJobList["items"][number];
export type DeviceSyncJobSummary =
    components["schemas"]["DeviceSyncJobSummaryDto"];
export type DeviceSyncJobStatus = DeviceSyncJobItem["status"];
export type DeviceSyncJobKind = DeviceSyncJobItem["kind"];

export type DeviceSyncStatusFilter = DeviceSyncJobStatus | "active" | "all";
