"use client";

import { Label } from "@/components/ui/label";

const SELECT_CLASS =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export type BlockUnitOption = {
    id: string;
    name: string;
    units: { id: string; name: string }[];
};

export function BlockUnitSelects({
    blocks,
    blockId,
    unitId,
    onBlockIdChange,
    onUnitIdChange,
    blockRequired = false,
    unitRequired = false,
    idPrefix = "location",
    blockName,
    unitName,
    plainLabels = false,
    emptyHint,
}: {
    blocks: BlockUnitOption[];
    blockId: string;
    unitId: string;
    onBlockIdChange: (blockId: string) => void;
    onUnitIdChange: (unitId: string) => void;
    blockRequired?: boolean;
    unitRequired?: boolean;
    idPrefix?: string;
    blockName?: string;
    unitName?: string;
    plainLabels?: boolean;
    emptyHint?: string;
}) {
    const units = blocks.find((block) => block.id === blockId)?.units ?? [];

    if (blocks.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                {emptyHint ??
                    "Nenhum bloco cadastrado. O condomínio precisa cadastrar blocos e unidades antes."}
            </p>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-block`}>
                    {plainLabels || blockRequired ? "Bloco" : "Bloco (opcional)"}
                </Label>
                <select
                    id={`${idPrefix}-block`}
                    name={blockName}
                    className={SELECT_CLASS}
                    value={blockId}
                    onChange={(event) => {
                        onBlockIdChange(event.target.value);
                        onUnitIdChange("");
                    }}
                >
                    <option value="">Selecione o bloco</option>
                    {blocks.map((block) => (
                        <option key={block.id} value={block.id}>
                            {block.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-unit`}>
                    {plainLabels || unitRequired
                        ? "Unidade"
                        : "Unidade (opcional)"}
                </Label>
                <select
                    id={`${idPrefix}-unit`}
                    name={unitName}
                    className={SELECT_CLASS}
                    value={unitId}
                    disabled={!blockId}
                    onChange={(event) => onUnitIdChange(event.target.value)}
                >
                    <option value="">
                        {blockId ? "Selecione a unidade" : "Escolha o bloco"}
                    </option>
                    {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                            {unit.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
