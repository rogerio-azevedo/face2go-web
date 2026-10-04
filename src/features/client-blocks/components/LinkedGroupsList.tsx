"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

import { ensureLocationUnitAction, moveLocationGroupsAction } from "../actions";
import { useLocationGroupList } from "../hooks/use-location-group-list";
import type {
    CatalogBlock,
    ClientLocationReview,
    LinkedLocationGroup,
} from "../types";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { LocationGroupCard } from "./LocationGroupCard";
import { LocationGroupListShell } from "./LocationGroupListShell";

const searchText = (group: LinkedLocationGroup) =>
    `${group.blockName} ${group.unitName}`;
/** Só a sugestão exata vem marcada, para não mover em massa por engano. */
const defaultUnitId = (group: LinkedLocationGroup) =>
    group.suggestion?.exact ? group.suggestion.unitId : "";

function withoutUnit(catalog: CatalogBlock[], unitId: string) {
    return catalog.map((block) => ({
        ...block,
        units: block.units.filter((unit) => unit.id !== unitId),
    }));
}

export function LinkedGroupsList({
    clientId,
    review,
    reload,
    onCatalogChange,
}: {
    clientId: string;
    review: ClientLocationReview;
    reload: () => Promise<void>;
    onCatalogChange?: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const list = useLocationGroupList({
        groups: review.linkedGroups,
        searchText,
        defaultUnitId,
    });

    async function move(
        items: { sourceUnitId: string; targetUnitId: string | null }[],
    ) {
        setBusy(true);
        try {
            const result = await moveLocationGroupsAction(clientId, items);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(
                result.unlinked > 0
                    ? `${result.unlinked} unidade(s) desvinculada(s). A origem ficou inativa.`
                    : `${result.moved} grupo(s) movido(s). A origem ficou inativa.`,
            );
            await reload();
            onCatalogChange?.();
        } finally {
            setBusy(false);
        }
    }

    async function createAndSelect(
        group: LinkedLocationGroup,
        input: { blockName: string; unitName: string },
    ) {
        setBusy(true);
        try {
            const result = await ensureLocationUnitAction(clientId, input);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            list.pick(group.key, result.unitId);
            await reload();
            onCatalogChange?.();
        } finally {
            setBusy(false);
        }
    }

    return (
        <LocationGroupListShell
            list={list}
            busy={busy}
            bulkLabel={`Mover ${list.resolved.length} grupo(s) com unidade escolhida`}
            onBulk={() =>
                void move(
                    list.resolved.map((group) => ({
                        sourceUnitId: group.unitId,
                        targetUnitId: list.unitIdOf(group),
                    })),
                )
            }
            emptyText="Ninguém vinculado a bloco e unidade."
            renderGroup={(group, index) => (
                <LocationGroupCard
                    key={group.key}
                    idPrefix={`linked-${index}`}
                    title={`Bloco ${group.blockName} · Unidade ${group.unitName}`}
                    badges={
                        <>
                            {!group.blockActive || !group.unitActive ? (
                                <Badge variant="destructive">
                                    {!group.blockActive
                                        ? "Bloco inativo"
                                        : "Unidade inativa"}
                                </Badge>
                            ) : null}
                            {group.inactive > 0 ? (
                                <Badge variant="outline">
                                    {group.inactive} pessoa(s) inativa(s)
                                </Badge>
                            ) : null}
                        </>
                    }
                    group={group}
                    createDefaults={{
                        blockName: group.blockName,
                        unitName: group.unitName,
                    }}
                    catalog={withoutUnit(review.catalog, group.unitId)}
                    unitId={list.unitIdOf(group)}
                    onUnitIdChange={(unitId) => list.pick(group.key, unitId)}
                    ignored={list.isIgnored(group.key)}
                    busy={busy}
                    actionLabel="Mover"
                    onAction={() =>
                        void move([
                            {
                                sourceUnitId: group.unitId,
                                targetUnitId: list.unitIdOf(group),
                            },
                        ])
                    }
                    onCreate={(input) => void createAndSelect(group, input)}
                    onToggleIgnored={() => list.toggleIgnored(group.key)}
                    extraActions={
                        <ConfirmDeleteButton
                            label="Desvincular"
                            title={`Desvincular ${group.blockName} / ${group.unitName}?`}
                            description="As pessoas ficam sem unidade (o texto de bloco e unidade é mantido) e a unidade é desativada. Quem estiver ativo aparece na aba “Sem vínculo”."
                            confirmLabel="Desvincular"
                            triggerVariant="outline"
                            busy={busy}
                            onConfirm={() =>
                                void move([
                                    {
                                        sourceUnitId: group.unitId,
                                        targetUnitId: null,
                                    },
                                ])
                            }
                        />
                    }
                />
            )}
        />
    );
}
