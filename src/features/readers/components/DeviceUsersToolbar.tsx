"use client";

import { Loader2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

import type { DeviceSyncJobStatus } from "@/app/company/leitores/actions";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";

export type DeviceUsersOriginFilter = "all" | "system" | "orphan";

function syncBannerText(job: DeviceSyncJobStatus, readerId: string): string {
    const onThisReader = job.targetId === readerId;
    const kind = job.force ? "Forçar" : "Sincronizar";
    const where = onThisReader ? "neste leitor" : "em outro leitor deste cliente";
    const total = job.total > 0 ? job.total : "…";
    return `${kind} ${where} — ${job.processed} de ${total}`;
}

export function DeviceUsersToolbar({
    search,
    onSearchChange,
    originFilter,
    onOriginFilterChange,
    selectedCount,
    pending,
    showSync,
    showWipe,
    syncBusy,
    activeJob,
    readerId,
    onRemoveSelected,
    onWipeAll,
    onSyncAll,
    onForceSync,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    originFilter: DeviceUsersOriginFilter;
    onOriginFilterChange: (value: DeviceUsersOriginFilter) => void;
    selectedCount: number;
    pending: boolean;
    showSync: boolean;
    showWipe: boolean;
    syncBusy: boolean;
    activeJob: DeviceSyncJobStatus | null;
    readerId: string;
    onRemoveSelected: () => void;
    onWipeAll: () => void;
    onSyncAll: () => void;
    onForceSync: () => void;
}) {
    const syncDisabled = pending || syncBusy;
    return (
        <div className="flex flex-col gap-3 border-b px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput
                    value={search}
                    onValueChange={onSearchChange}
                    placeholder="Buscar por nome..."
                    className="sm:max-w-xs"
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pending || selectedCount === 0}
                        onClick={onRemoveSelected}
                    >
                        Remover selecionados ({selectedCount})
                    </Button>
                    {showSync ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={syncDisabled}
                                onClick={onForceSync}
                            >
                                <RotateCcw className="size-4" />
                                Forçar neste leitor
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={syncDisabled}
                                onClick={onSyncAll}
                            >
                                <RefreshCw className="size-4" />
                                Sincronizar neste leitor
                            </Button>
                        </>
                    ) : null}
                    {showWipe ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1.5"
                            disabled={syncDisabled}
                            onClick={onWipeAll}
                        >
                            <Trash2 className="size-4" />
                            Apagar todos
                        </Button>
                    ) : null}
                </div>
            </div>
            {activeJob ? (
                <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                    <span>{syncBannerText(activeJob, readerId)}</span>
                    <span className="text-xs">
                        Pode sair desta tela — o sync continua em segundo plano.
                    </span>
                </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
                {(
                    [
                        ["all", "Todos"],
                        ["system", "No sistema"],
                        ["orphan", "Só no leitor"],
                    ] as const
                ).map(([value, label]) => (
                    <Button
                        key={value}
                        variant={originFilter === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onOriginFilterChange(value)}
                    >
                        {label}
                    </Button>
                ))}
                {search.trim() ? (
                    <p className="text-sm text-muted-foreground">
                        Filtrando por &quot;{search.trim()}&quot;
                    </p>
                ) : null}
            </div>
        </div>
    );
}
