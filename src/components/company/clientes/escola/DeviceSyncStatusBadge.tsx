"use client";

import type { DeviceSyncStatus } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isPartialSyncError } from "@/lib/face-sync-result";

function syncStatusBadgeVariant(
    s: DeviceSyncStatus | null | undefined,
    error?: string | null,
): "default" | "secondary" | "destructive" | "outline" {
    if (s === "synced" && isPartialSyncError(error)) return "secondary";
    if (s === "synced") return "default";
    if (s === "pending_sync") return "secondary";
    if (s === "sync_failed") return "destructive";
    return "outline";
}

function syncStatusLabel(
    s: DeviceSyncStatus | null | undefined,
    error?: string | null,
): string {
    if (s === "synced" && isPartialSyncError(error)) return "Parcial";
    if (s === "synced") return "Sincronizado";
    if (s === "pending_sync") return "Pendente";
    if (s === "sync_failed") return "Erro";
    return "Sem face";
}

export function DeviceSyncStatusBadge({
    status,
    hasFace,
    error,
}: {
    status: DeviceSyncStatus | null | undefined;
    hasFace: boolean;
    error?: string | null;
}) {
    if (!hasFace) {
        return (
            <span className="text-muted-foreground text-xs">Sem foto</span>
        );
    }

    const partial = status === "synced" && isPartialSyncError(error);

    return (
        <Badge
            variant={syncStatusBadgeVariant(status, error)}
            title={error ?? undefined}
            className={cn(
                "whitespace-nowrap",
                partial &&
                    "border-amber-500/40 bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100",
            )}
        >
            {syncStatusLabel(status, error)}
        </Badge>
    );
}
