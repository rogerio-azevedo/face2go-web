"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
    createClientUnitAction,
    generateClientUnitsAction,
    updateClientBlockAction,
} from "../actions";
import type { CatalogBlock } from "../types";
import { UnitEditor, type RunTask } from "./UnitEditor";

export function BlockCard({
    clientId,
    block,
    busy,
    run,
}: {
    clientId: string;
    block: CatalogBlock;
    busy: boolean;
    run: RunTask;
}) {
    const [open, setOpen] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    const activeCount = block.units.filter((unit) => unit.isActive).length;
    const units = [...block.units].sort(
        (a, b) => Number(b.isActive) - Number(a.isActive),
    );
    const selected = block.units.find((unit) => unit.id === selectedUnitId);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="rounded-lg border"
        >
            <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left">
                <span className="font-medium">Bloco {block.name}</span>
                <Badge variant="outline">
                    {activeCount} unidade{activeCount === 1 ? "" : "s"}
                </Badge>
                {!block.isActive ? (
                    <Badge variant="secondary">Inativo</Badge>
                ) : null}
                <ChevronDown
                    className={cn(
                        "text-muted-foreground ml-auto size-4 transition-transform",
                        open && "rotate-180",
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 border-t px-4 py-4">
                <BlockNameForm
                    key={`${block.name}-${block.isActive}`}
                    clientId={clientId}
                    block={block}
                    busy={busy}
                    run={run}
                />

                {units.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Nenhuma unidade neste bloco.
                    </p>
                ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {units.map((unit) => (
                            <Button
                                key={unit.id}
                                type="button"
                                size="sm"
                                variant={
                                    unit.id === selectedUnitId
                                        ? "default"
                                        : "outline"
                                }
                                className={cn(
                                    !unit.isActive &&
                                        "text-muted-foreground line-through",
                                )}
                                onClick={() =>
                                    setSelectedUnitId((current) =>
                                        current === unit.id ? null : unit.id,
                                    )
                                }
                            >
                                {unit.name}
                            </Button>
                        ))}
                    </div>
                )}

                {selected ? (
                    <UnitEditor
                        key={`${selected.id}-${selected.name}-${selected.isActive}`}
                        clientId={clientId}
                        blockName={block.name}
                        unit={selected}
                        busy={busy}
                        run={run}
                        onClose={() => setSelectedUnitId(null)}
                    />
                ) : null}

                {block.isActive ? (
                    <BlockFooter
                        clientId={clientId}
                        blockId={block.id}
                        busy={busy}
                        run={run}
                    />
                ) : null}
            </CollapsibleContent>
        </Collapsible>
    );
}

function BlockNameForm({
    clientId,
    block,
    busy,
    run,
}: {
    clientId: string;
    block: CatalogBlock;
    busy: boolean;
    run: RunTask;
}) {
    const [name, setName] = useState(block.name);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="max-w-xs"
                disabled={busy || !block.isActive}
                aria-label="Nome do bloco"
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || !block.isActive || name.trim() === block.name}
                onClick={() =>
                    void run(() =>
                        updateClientBlockAction(clientId, block.id, {
                            name: name.trim(),
                        }),
                    )
                }
            >
                Renomear bloco
            </Button>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                    void run(() =>
                        updateClientBlockAction(clientId, block.id, {
                            isActive: !block.isActive,
                        }),
                    )
                }
            >
                {block.isActive ? "Desativar bloco" : "Reativar bloco"}
            </Button>
        </div>
    );
}

function BlockFooter({
    clientId,
    blockId,
    busy,
    run,
}: {
    clientId: string;
    blockId: string;
    busy: boolean;
    run: RunTask;
}) {
    const [unitName, setUnitName] = useState("");
    const [floorStart, setFloorStart] = useState("1");
    const [floorEnd, setFloorEnd] = useState("");
    const [unitsPerFloor, setUnitsPerFloor] = useState("");

    return (
        <div className="grid gap-3 border-t pt-3 md:grid-cols-2">
            <form
                className="flex items-end gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                        const result = await createClientUnitAction(
                            clientId,
                            blockId,
                            unitName,
                        );
                        if (!("error" in result)) setUnitName("");
                        return result;
                    });
                }}
            >
                <div className="flex-1 space-y-1">
                    <Label htmlFor={`new-unit-${blockId}`}>Nova unidade</Label>
                    <Input
                        id={`new-unit-${blockId}`}
                        value={unitName}
                        onChange={(event) => setUnitName(event.target.value)}
                        placeholder="Ex.: 101"
                        disabled={busy}
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    disabled={busy || !unitName.trim()}
                >
                    Adicionar
                </Button>
            </form>
            <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                        const result = await generateClientUnitsAction(
                            clientId,
                            blockId,
                            {
                                floorStart: Number(floorStart),
                                floorEnd: Number(floorEnd),
                                unitsPerFloor: Number(unitsPerFloor),
                            },
                        );
                        if ("error" in result) return result;
                        toast.success(
                            `${result.created} criadas, ${result.skipped} já existiam.`,
                        );
                        return { success: true };
                    });
                }}
            >
                <div className="space-y-1">
                    <Label htmlFor={`floor-start-${blockId}`}>1º andar</Label>
                    <Input
                        id={`floor-start-${blockId}`}
                        inputMode="numeric"
                        value={floorStart}
                        onChange={(event) => setFloorStart(event.target.value)}
                        className="w-20"
                        disabled={busy}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`floor-end-${blockId}`}>Último andar</Label>
                    <Input
                        id={`floor-end-${blockId}`}
                        inputMode="numeric"
                        value={floorEnd}
                        onChange={(event) => setFloorEnd(event.target.value)}
                        className="w-20"
                        disabled={busy}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`per-floor-${blockId}`}>
                        Aptos por andar
                    </Label>
                    <Input
                        id={`per-floor-${blockId}`}
                        inputMode="numeric"
                        value={unitsPerFloor}
                        onChange={(event) =>
                            setUnitsPerFloor(event.target.value)
                        }
                        className="w-20"
                        disabled={busy}
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    disabled={
                        busy ||
                        floorStart.trim() === "" ||
                        floorEnd.trim() === "" ||
                        unitsPerFloor.trim() === ""
                    }
                >
                    Gerar andares
                </Button>
            </form>
        </div>
    );
}
