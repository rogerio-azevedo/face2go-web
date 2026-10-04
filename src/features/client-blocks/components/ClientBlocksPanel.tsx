"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { deferInEffect } from "@/lib/defer-in-effect";

import { createClientBlockAction, listClientBlocksAction } from "../actions";
import type { CatalogBlock } from "../types";
import { BlockCard } from "./BlockCard";
import { GenerateStructureForm } from "./GenerateStructureForm";

export function ClientBlocksPanel({
    clientId,
    showHeading = true,
    reloadKey = 0,
    onChange,
    canMovePeople = false,
}: {
    clientId: string;
    /** Mover/desvincular pessoas é só para admin da empresa. */
    canMovePeople?: boolean;
    showHeading?: boolean;
    reloadKey?: number;
    onChange?: () => void;
}) {
    const [blocks, setBlocks] = useState<CatalogBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [blockName, setBlockName] = useState("");
    const [busy, setBusy] = useState(false);
    const [includeAdministrative, setIncludeAdministrative] = useState(false);

    const residentialBlocks = blocks.filter((block) => !block.isAdministrative);
    const administrativeBlocks = includeAdministrative
        ? blocks.filter((block) => block.isAdministrative)
        : [];
    const countedBlocks = [...residentialBlocks, ...administrativeBlocks].filter(
        (block) => block.isActive,
    );
    const countedUnits = countedBlocks.reduce(
        (total, block) =>
            total + block.units.filter((unit) => unit.isActive).length,
        0,
    );
    const hasAdministrative = blocks.some((block) => block.isAdministrative);

    async function refresh() {
        const result = await listClientBlocksAction(clientId);
        if ("error" in result) {
            toast.error(result.error);
            return;
        }
        setBlocks(result.items);
        onChange?.();
    }

    useEffect(() => {
        deferInEffect(() => {
            void (async () => {
                const result = await listClientBlocksAction(clientId);
                if ("error" in result) toast.error(result.error);
                else setBlocks(result.items);
                setLoading(false);
            })();
        });
    }, [clientId, reloadKey]);

    async function run(task: () => Promise<{ error: string } | { success: true }>) {
        setBusy(true);
        try {
            const result = await task();
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            await refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="space-y-4">
            {showHeading ? (
                <div>
                    <h2 className="text-lg font-semibold">Blocos e unidades</h2>
                    <p className="text-muted-foreground text-sm">
                        Cadastre os blocos e as unidades antes de receber
                        moradores. Pessoas do mesmo apartamento escolhem a mesma
                        unidade.
                    </p>
                </div>
            ) : null}
            <GenerateStructureForm
                clientId={clientId}
                busy={busy}
                onDone={refresh}
            />
            <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                    event.preventDefault();
                    void run(async () => {
                        const result = await createClientBlockAction(
                            clientId,
                            blockName,
                        );
                        if (!("error" in result)) setBlockName("");
                        return result;
                    });
                }}
            >
                <Input
                    value={blockName}
                    onChange={(event) => setBlockName(event.target.value)}
                    placeholder="Nome do bloco"
                    disabled={busy}
                />
                <Button type="submit" disabled={busy || !blockName.trim()}>
                    Novo bloco
                </Button>
            </form>
            {loading ? (
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Carregando blocos…
                </p>
            ) : blocks.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    Nenhum bloco ainda. Crie o primeiro para liberar o cadastro.
                </p>
            ) : (
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-muted-foreground text-sm">
                            {countedUnits} unidade{countedUnits === 1 ? "" : "s"}{" "}
                            em {countedBlocks.length} bloco
                            {countedBlocks.length === 1 ? "" : "s"}
                        </p>
                        {hasAdministrative ? (
                            <Label className="text-sm font-normal">
                                <Checkbox
                                    checked={includeAdministrative}
                                    onCheckedChange={(value) =>
                                        setIncludeAdministrative(value === true)
                                    }
                                />
                                Incluir administrativos
                            </Label>
                        ) : null}
                    </div>
                    {residentialBlocks.map((block) => (
                        <BlockCard
                            key={block.id}
                            clientId={clientId}
                            block={block}
                            busy={busy}
                            run={run}
                            catalog={blocks}
                            canMovePeople={canMovePeople}
                        />
                    ))}
                    {administrativeBlocks.length > 0 ? (
                        <>
                            {residentialBlocks.length > 0 ? (
                                <Separator className="my-4" />
                            ) : null}
                            {administrativeBlocks.map((block) => (
                                <BlockCard
                                    key={block.id}
                                    clientId={clientId}
                                    block={block}
                                    busy={busy}
                                    run={run}
                                    catalog={blocks}
                                    canMovePeople={canMovePeople}
                                />
                            ))}
                        </>
                    ) : null}
                </div>
            )}
        </section>
    );
}
