"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deferInEffect } from "@/lib/defer-in-effect";

import { getUnitPeopleAction, moveLocationGroupsAction } from "../actions";
import type { CatalogBlock, CatalogUnit, LocationReviewPerson } from "../types";
import { BlockUnitSelects } from "./BlockUnitSelects";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { PeopleList } from "./LocationGroupCard";
import type { RunTask } from "./UnitEditor";

function moveTargets(catalog: CatalogBlock[], unitId: string) {
    return catalog
        .filter((block) => block.isActive)
        .map((block) => ({
            ...block,
            units: block.units.filter(
                (unit) => unit.isActive && unit.id !== unitId,
            ),
        }));
}

/** Pessoas vinculadas à unidade, com mover/desvincular para liberar a exclusão. */
export function UnitPeople({
    clientId,
    unit,
    catalog,
    canMove,
    busy,
    run,
}: {
    clientId: string;
    unit: CatalogUnit;
    catalog: CatalogBlock[];
    canMove: boolean;
    busy: boolean;
    run: RunTask;
}) {
    const [people, setPeople] = useState<LocationReviewPerson[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [blockId, setBlockId] = useState("");
    const [targetUnitId, setTargetUnitId] = useState("");

    useEffect(() => {
        deferInEffect(() => {
            void (async () => {
                const result = await getUnitPeopleAction(clientId, unit.id);
                if ("error" in result) setError(result.error);
                else setPeople(result.people);
            })();
        });
    }, [clientId, unit.id]);

    if (error) return <p className="text-destructive text-sm">{error}</p>;
    if (!people) {
        return <p className="text-muted-foreground text-sm">Carregando…</p>;
    }
    if (people.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                Ninguém vinculado a esta unidade.
                {unit.isActive
                    ? " Desative-a para poder excluir."
                    : " Já pode excluir."}
            </p>
        );
    }

    const move = (target: string | null) =>
        void run(async () => {
            const result = await moveLocationGroupsAction(clientId, [
                { sourceUnitId: unit.id, targetUnitId: target },
            ]);
            if ("success" in result) {
                toast.success(
                    target
                        ? "Pessoas movidas. A unidade ficou inativa."
                        : "Pessoas desvinculadas. A unidade ficou inativa.",
                );
            }
            return result;
        });

    return (
        <div className="w-full space-y-3 rounded-md border bg-background p-3">
            <PeopleList people={people} />
            {canMove ? (
                <>
                    <BlockUnitSelects
                        blocks={moveTargets(catalog, unit.id)}
                        blockId={blockId}
                        unitId={targetUnitId}
                        onBlockIdChange={setBlockId}
                        onUnitIdChange={setTargetUnitId}
                        idPrefix={`move-${unit.id}`}
                        plainLabels
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            disabled={busy || !targetUnitId}
                            onClick={() => move(targetUnitId)}
                        >
                            Mover {people.length} para a unidade escolhida
                        </Button>
                        <ConfirmDeleteButton
                            label="Desvincular"
                            title={`Desvincular ${people.length} pessoa(s)?`}
                            description="As pessoas ficam sem unidade (o texto de bloco e unidade é mantido) e esta unidade é desativada. Quem estiver ativo aparece em “Sem vínculo” para vincular depois."
                            confirmLabel="Desvincular"
                            triggerVariant="outline"
                            busy={busy}
                            onConfirm={() => move(null)}
                        />
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Depois de mover ou desvincular, esta unidade fica
                        inativa e pode ser excluída.
                    </p>
                </>
            ) : null}
        </div>
    );
}
