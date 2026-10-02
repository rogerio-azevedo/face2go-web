import type { components } from "@/types/api.generated";

export type ClientDashboard = components["schemas"]["ClientDashboardDto"];
export type ClientDashboardAccess =
    ClientDashboard["recentAccesses"][number];
