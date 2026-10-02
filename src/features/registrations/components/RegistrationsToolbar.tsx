"use client";

import { Loader2, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ExportRegistrationsExcelButton } from "@/features/registrations/components/ExportRegistrationsExcelButton";
import { RegistrationsFaceSyncAllModal } from "@/features/registrations/components/RegistrationsFaceSyncAllModal";
import {
    REGISTRATION_TAB_LABELS,
    type RegistrationListTab,
} from "@/features/registrations/lib/registration-format";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { deferInEffect } from "@/lib/defer-in-effect";
import { cn } from "@/lib/utils";

const SCROLLBAR_NONE = "scrollbar-none";

type RegistrationsToolbarProps = {
    tab: RegistrationListTab;
    counts?: Partial<Record<RegistrationListTab, number>>;
    onTabChange: (tab: RegistrationListTab) => void;
    showLinks: boolean;
    linksCount?: number;
    onShowLinks?: () => void;
    search: string;
    onSearchChange: (value: string) => void;
    showBlockUnit: boolean;
    block: string;
    onBlockChange: (value: string) => void;
    unit: string;
    onUnitChange: (value: string) => void;
    showRoom: boolean;
    room: string;
    onRoomChange: (value: string) => void;
    variant: "client" | "company";
    companyClientId?: string;
    syncBusy?: boolean;
};

export function RegistrationsToolbar({
    tab,
    counts,
    onTabChange,
    showLinks,
    linksCount,
    onShowLinks,
    search,
    onSearchChange,
    showBlockUnit,
    block,
    onBlockChange,
    unit,
    onUnitChange,
    showRoom,
    room,
    onRoomChange,
    variant,
    companyClientId,
    syncBusy = false,
}: RegistrationsToolbarProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const chipRefs = useRef<
        Partial<Record<RegistrationListTab | "links", HTMLButtonElement | null>>
    >({});

    const hasLocationFilters = showBlockUnit || showRoom;
    const filterCount = [
        showBlockUnit ? block.trim() : "",
        showBlockUnit ? unit.trim() : "",
        showRoom ? room.trim() : "",
    ].filter(Boolean).length;

    useEffect(() => {
        const key = showLinks ? "links" : tab;
        chipRefs.current[key]?.scrollIntoView({
            inline: "nearest",
            block: "nearest",
        });
    }, [showLinks, tab]);

    useEffect(() => {
        if (!syncBusy) return;
        deferInEffect(() => setMoreOpen(true));
    }, [syncBusy]);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible",
                        SCROLLBAR_NONE,
                    )}
                >
                    {(
                        Object.keys(REGISTRATION_TAB_LABELS) as RegistrationListTab[]
                    ).map((key) => (
                        <Button
                            key={key}
                            ref={(node) => {
                                chipRefs.current[key] = node;
                            }}
                            type="button"
                            size="sm"
                            className="shrink-0"
                            variant={
                                !showLinks && tab === key ? "default" : "outline"
                            }
                            onClick={() => onTabChange(key)}
                        >
                            {REGISTRATION_TAB_LABELS[key]}
                            <span className="ml-1.5 rounded-md bg-background/20 px-1.5 text-xs">
                                {counts?.[key] ?? 0}
                            </span>
                        </Button>
                    ))}
                    {onShowLinks ? (
                        <Button
                            ref={(node) => {
                                chipRefs.current.links = node;
                            }}
                            type="button"
                            size="sm"
                            className="shrink-0"
                            variant={showLinks ? "default" : "outline"}
                            onClick={onShowLinks}
                        >
                            Links de cadastro
                            {linksCount != null ? (
                                <span className="ml-1.5 rounded-md bg-background/20 px-1.5 text-xs">
                                    {linksCount}
                                </span>
                            ) : null}
                        </Button>
                    ) : null}
                </div>
                <div className="hidden shrink-0 md:block">
                    <ExportRegistrationsExcelButton
                        variant={variant}
                        companyClientId={companyClientId}
                        search={search}
                        block={block}
                        unit={unit}
                        room={room}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                <div className="flex w-full min-w-0 items-center gap-2 md:contents">
                    <SearchInput
                        id="search-registrations"
                        value={search}
                        onValueChange={onSearchChange}
                        placeholder="Buscar por nome ou CPF…"
                        className="min-w-0 flex-1 md:max-w-sm"
                    />
                    <div className="flex shrink-0 gap-2 md:hidden">
                        {hasLocationFilters ? (
                            <Button
                                type="button"
                                size="sm"
                                variant={
                                    filtersOpen || filterCount > 0
                                        ? "secondary"
                                        : "outline"
                                }
                                aria-expanded={filtersOpen}
                                onClick={() => setFiltersOpen((open) => !open)}
                            >
                                <SlidersHorizontal />
                                Filtros
                                {filterCount > 0 ? (
                                    <span className="bg-background/60 rounded-md px-1.5 text-xs">
                                        {filterCount}
                                    </span>
                                ) : null}
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            size="sm"
                            variant={moreOpen ? "secondary" : "outline"}
                            aria-expanded={moreOpen}
                            onClick={() => setMoreOpen((open) => !open)}
                        >
                            {syncBusy ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <MoreHorizontal />
                            )}
                            Mais
                        </Button>
                    </div>
                </div>
                <div
                    className={cn(
                        "flex flex-col gap-2 md:contents",
                        !filtersOpen && "max-md:hidden",
                    )}
                >
                    {showBlockUnit ? (
                        <>
                            <SearchInput
                                id="search-registrations-block"
                                value={block}
                                onValueChange={onBlockChange}
                                placeholder="Bloco"
                                className="w-full md:max-w-40 md:min-w-32"
                            />
                            <SearchInput
                                id="search-registrations-unit"
                                value={unit}
                                onValueChange={onUnitChange}
                                placeholder="Unidade"
                                className="w-full md:max-w-40 md:min-w-32"
                            />
                        </>
                    ) : null}
                    {showRoom ? (
                        <SearchInput
                            id="search-registrations-room"
                            value={room}
                            onValueChange={onRoomChange}
                            placeholder="Sala"
                            className="w-full md:max-w-40 md:min-w-32"
                        />
                    ) : null}
                </div>
                <div
                    className={cn(
                        "flex flex-col items-stretch gap-2 md:ml-auto",
                        !moreOpen && "max-md:hidden",
                    )}
                >
                    <div className="md:hidden">
                        <ExportRegistrationsExcelButton
                            variant={variant}
                            companyClientId={companyClientId}
                            search={search}
                            block={block}
                            unit={unit}
                            room={room}
                        />
                    </div>
                    <RegistrationsFaceSyncAllModal
                        variant={variant}
                        companyClientId={companyClientId}
                    />
                </div>
            </div>
        </div>
    );
}
