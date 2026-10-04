"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { useLocationGroupList } from "../hooks/use-location-group-list";

export function LocationGroupListShell<T extends { key: string }>({
    list,
    busy,
    bulkLabel,
    onBulk,
    emptyText,
    renderGroup,
}: {
    list: ReturnType<typeof useLocationGroupList<T>>;
    busy: boolean;
    bulkLabel: string;
    onBulk: () => void;
    emptyText: string;
    renderGroup: (group: T, index: number) => ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                    value={list.search}
                    onChange={(event) => list.setSearch(event.target.value)}
                    placeholder="Buscar bloco ou unidade"
                    className="sm:max-w-xs"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={list.toggleShowIgnored}
                >
                    {list.showIgnored
                        ? "Ver pendentes"
                        : `Ver ignorados (${list.ignoredCount})`}
                </Button>
                <Button
                    type="button"
                    className="sm:ml-auto"
                    disabled={busy || list.resolved.length === 0}
                    onClick={onBulk}
                >
                    {bulkLabel}
                </Button>
            </div>

            {list.filtered.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    {list.showIgnored ? "Nenhum grupo ignorado." : emptyText}
                </p>
            ) : (
                <div className="space-y-3">
                    {list.filtered.slice(0, list.visible).map(renderGroup)}
                    {list.filtered.length > list.visible ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={list.showMore}
                        >
                            Mostrar mais ({list.filtered.length - list.visible})
                        </Button>
                    ) : null}
                </div>
            )}
        </div>
    );
}
