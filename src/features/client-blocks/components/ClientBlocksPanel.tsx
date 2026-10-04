"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deferInEffect } from "@/lib/defer-in-effect";

import { createClientBlockAction, listClientBlocksAction } from "../actions";
import type { CatalogBlock } from "../types";
import { BlockCard } from "./BlockCard";
import { GenerateStructureForm } from "./GenerateStructureForm";

export function ClientBlocksPanel({
    clientId,
    showHeading = true,
}: {
    clientId: string;
    showHeading?: boolean;
}) {
    const [blocks, setBlocks] = useState<CatalogBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [blockName, setBlockName] = useState("");
    const [busy, setBusy] = useState(false);

    async function refresh() {
        const result = await listClientBlocksAction(clientId);
        if ("error" in result) {
            toast.error(result.error);
            return;
        }
        setBlocks(result.items);
    }

    useEffect(() => {
        deferInEffect(() => {
            void (async () => {
                setLoading(true);
                const result = await listClientBlocksAction(clientId);
                if ("error" in result) toast.error(result.error);
                else setBlocks(result.items);
                setLoading(false);
            })();
        });
    }, [clientId]);

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
                    {blocks.map((block) => (
                        <BlockCard
                            key={block.id}
                            clientId={clientId}
                            block={block}
                            busy={busy}
                            run={run}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
