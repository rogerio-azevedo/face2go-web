"use client";

import { useState } from "react";
import { toast } from "sonner";

import { bindLocationGroupsAction, ensureLocationUnitAction } from "../actions";
import { useLocationGroupList } from "../hooks/use-location-group-list";
import type { ClientLocationReview, LocationReviewGroup } from "../types";
import { LocationGroupCard } from "./LocationGroupCard";
import { LocationGroupListShell } from "./LocationGroupListShell";

const searchText = (group: LocationReviewGroup) =>
    `${group.blockText} ${group.unitText}`;
const defaultUnitId = (group: LocationReviewGroup) =>
    group.suggestion?.unitId ?? "";

export function UnlinkedGroupsList({
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
        groups: review.groups,
        searchText,
        defaultUnitId,
    });

    async function bind(items: LocationReviewGroup[]) {
        setBusy(true);
        try {
            const result = await bindLocationGroupsAction(
                clientId,
                items.map((group) => ({
                    blockText: group.blockText,
                    unitText: group.unitText,
                    unitId: list.unitIdOf(group),
                })),
            );
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(
                `${result.registrations} cadastro(s) e ${result.members} membro(s) vinculados.`,
            );
            await reload();
        } finally {
            setBusy(false);
        }
    }

    async function createAndSelect(
        group: LocationReviewGroup,
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
            bulkLabel={`Vincular ${list.resolved.length} grupo(s) com unidade escolhida`}
            onBulk={() => void bind(list.resolved)}
            emptyText="Nenhum texto pendente de vínculo."
            renderGroup={(group, index) => (
                <LocationGroupCard
                    key={group.key}
                    idPrefix={`group-${index}`}
                    title={`Bloco: ${group.blockText || "—"} · Unidade: ${group.unitText || "—"}`}
                    group={group}
                    createDefaults={{
                        blockName: group.blockText,
                        unitName: group.unitText,
                    }}
                    catalog={review.catalog}
                    unitId={list.unitIdOf(group)}
                    onUnitIdChange={(unitId) => list.pick(group.key, unitId)}
                    ignored={list.isIgnored(group.key)}
                    busy={busy}
                    actionLabel="Vincular"
                    onAction={() => void bind([group])}
                    onCreate={(input) => void createAndSelect(group, input)}
                    onToggleIgnored={() => list.toggleIgnored(group.key)}
                />
            )}
        />
    );
}
