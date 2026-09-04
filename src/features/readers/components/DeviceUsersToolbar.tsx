"use client";

import { RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";

export type DeviceUsersOriginFilter = "all" | "system" | "orphan";

export function DeviceUsersToolbar({
    search,
    onSearchChange,
    originFilter,
    onOriginFilterChange,
    selectedCount,
    pending,
    showRebuild,
    onRemoveSelected,
    onWipeAll,
    onSyncAll,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    originFilter: DeviceUsersOriginFilter;
    onOriginFilterChange: (value: DeviceUsersOriginFilter) => void;
    selectedCount: number;
    pending: boolean;
    showRebuild: boolean;
    onRemoveSelected: () => void;
    onWipeAll: () => void;
    onSyncAll: () => void;
}) {
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
                    {showRebuild ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={pending}
                                onClick={onSyncAll}
                            >
                                <RefreshCw className="size-4" />
                                Sincronizar neste leitor
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-1.5"
                                disabled={pending}
                                onClick={onWipeAll}
                            >
                                <Trash2 className="size-4" />
                                Apagar todos
                            </Button>
                        </>
                    ) : null}
                </div>
            </div>
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
