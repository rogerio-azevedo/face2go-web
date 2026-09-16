"use client";

import type { DeviceSyncStatus } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    isPartialSyncError,
    readerSyncFraction,
} from "@/lib/face-sync-result";

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

function syncStatusTitle(params: {
    status: DeviceSyncStatus | null | undefined;
    error?: string | null;
    fraction: string | null;
    isMinor?: boolean | null;
}): string | undefined {
    const { status, error, fraction, isMinor } = params;
    if (error) return error;
    if (status === "synced" && fraction) {
        if (isMinor) {
            return `Sincronizado em ${fraction} leitores. Menor não entra em leitor 18+.`;
        }
        return `Sincronizado em ${fraction} leitores.`;
    }
    return undefined;
}

export function DeviceSyncStatusBadge({
    status,
    hasFace,
    hasReaders,
    error,
    syncedCount,
    totalCount,
    isMinor,
}: {
    status: DeviceSyncStatus | null | undefined;
    hasFace: boolean;
    hasReaders: boolean;
    error?: string | null;
    syncedCount?: number | null;
    totalCount?: number | null;
    isMinor?: boolean | null;
}) {
    if (!hasFace) {
        return (
            <span className="text-muted-foreground text-xs">Sem foto</span>
        );
    }

    if (!hasReaders) {
        return null;
    }

    const partial = status === "synced" && isPartialSyncError(error);
    const fraction = readerSyncFraction(syncedCount, totalCount);
    const label = syncStatusLabel(status, error);

    return (
        <Badge
            variant={syncStatusBadgeVariant(status, error)}
            title={syncStatusTitle({
                status,
                error,
                fraction,
                isMinor,
            })}
            className={cn(
                "whitespace-nowrap",
                partial &&
                    "border-amber-500/40 bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100",
            )}
        >
            {fraction ? `${label} ${fraction}` : label}
        </Badge>
    );
}
