"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { moveLocationPersonAction } from "../actions/move-person";
import type { CatalogBlock, LocationReviewPerson } from "../types";
import { BlockUnitSelects } from "./BlockUnitSelects";
import { PeopleList } from "./LocationGroupCard";
import type { RunTask } from "./UnitEditor";

/** A single dialog per list; action updates only the selected logical person. */
export function PersonLocationList({ clientId, sourceUnitId, sourceBlockName, sourceUnitName, people, total, catalog, busy, run, onMoved }: {
    clientId: string;
    sourceUnitId: string;
    sourceBlockName: string;
    sourceUnitName: string;
    people: LocationReviewPerson[];
    total?: number;
    catalog: CatalogBlock[];
    busy: boolean;
    run: RunTask;
    onMoved?: (person: LocationReviewPerson) => void;
}) {
    const [selected, setSelected] = useState<LocationReviewPerson | null>(null);
    const [blockId, setBlockId] = useState("");
    const [unitId, setUnitId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const blocks = catalog.filter((block) => block.isActive).map((block) => ({
        ...block, units: block.units.filter((unit) => unit.isActive && unit.id !== sourceUnitId),
    })).filter((block) => block.units.length > 0);
    const targetBlock = blocks.find((block) => block.id === blockId);
    const targetUnit = targetBlock?.units.find((unit) => unit.id === unitId);

    function select(person: LocationReviewPerson) {
        setBlockId("");
        setUnitId("");
        setError(null);
        setSelected(person);
    }

    function save() {
        if (!selected || !targetBlock || !targetUnit || busy) return;
        const person = selected;
        void run(async () => {
            setError(null);
            const result = await moveLocationPersonAction(clientId, {
                kind: person.kind, personId: person.id, sourceUnitId,
                targetBlockId: targetBlock.id, targetUnitId: targetUnit.id,
            });
            if ("error" in result) {
                setError(result.error);
                return result;
            }
            onMoved?.(person);
            setSelected(null);
            toast.success(`${person.name ?? "Pessoa"} movida para Bloco ${targetBlock.name} · Unidade ${targetUnit.name}.`);
            return result;
        });
    }

    return <>
        <PeopleList people={people} total={total} renderAction={(person) => (
            <Button type="button" size="sm" variant="outline" disabled={busy}
                aria-label={`Alterar bloco/unidade de ${person.name ?? "pessoa sem nome"}`}
                onClick={() => select(person)}>Alterar bloco/unidade</Button>
        )} />
        <Dialog open={selected !== null} onOpenChange={(open) => { if (!open && !busy) setSelected(null); }}>
            <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
                <DialogHeader>
                    <DialogTitle>Alterar bloco/unidade</DialogTitle>
                    <DialogDescription>
                        {selected?.name ?? "Sem nome"}
                        {selected?.faceId != null ? ` · ID ${selected.faceId}` : ""}
                        {selected?.active === false ? " · Inativo" : ""}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-4">
                    <p className="text-sm"><span className="text-muted-foreground">Local atual: </span>
                        Bloco {sourceBlockName} · Unidade {sourceUnitName}</p>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Novo bloco e unidade</p>
                        <BlockUnitSelects blocks={blocks} blockId={blockId} unitId={unitId}
                            onBlockIdChange={setBlockId} onUnitIdChange={setUnitId}
                            idPrefix={`person-move-${sourceUnitId}`} disabled={busy} blockRequired unitRequired
                            emptyHint="Não há outra unidade ativa disponível. Cadastre ou reative o destino antes de alterar." />
                    </div>
                    <p className="text-muted-foreground text-xs">Somente esta pessoa será movida. A unidade de origem continuará ativa.</p>
                    {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={busy} onClick={() => setSelected(null)}>Cancelar</Button>
                        <Button type="submit" disabled={busy || !targetUnit}>{busy ? "Salvando…" : "Salvar alteração"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </>;
}
