"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deferInEffect } from "@/lib/defer-in-effect";

import {
    createClientBlockAction,
    createClientUnitAction,
    generateClientUnitsAction,
    listClientBlocksAction,
    mergeClientUnitAction,
    updateClientBlockAction,
    updateClientUnitAction,
} from "../actions";
import type { CatalogBlock } from "../types";

const SELECT_CLASS =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm";

export function ClientBlocksPanel({ clientId }: { clientId: string }) {
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
            <div>
                <h2 className="text-lg font-semibold">Blocos e unidades</h2>
                <p className="text-muted-foreground text-sm">
                    Cadastre os blocos e as unidades antes de receber moradores.
                    Pessoas do mesmo apartamento escolhem a mesma unidade.
                </p>
            </div>
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
                <div className="space-y-4">
                    {blocks.map((block) => (
                        <BlockCard
                            key={block.id}
                            clientId={clientId}
                            block={block}
                            blocks={blocks}
                            busy={busy}
                            run={run}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function BlockCard({
    clientId,
    block,
    blocks,
    busy,
    run,
}: {
    clientId: string;
    block: CatalogBlock;
    blocks: CatalogBlock[];
    busy: boolean;
    run: (
        task: () => Promise<{ error: string } | { success: true }>,
    ) => Promise<void>;
}) {
    const [name, setName] = useState(block.name);
    const [unitName, setUnitName] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    useEffect(() => {
        setName(block.name);
    }, [block.name]);

    const targets = blocks.flatMap((item) =>
        item.units
            .filter((unit) => unit.id !== "" && unit.isActive)
            .map((unit) => ({
                id: unit.id,
                label: `${item.name} · ${unit.name}`,
            })),
    );

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="max-w-xs"
                    disabled={busy || !block.isActive}
                />
                {!block.isActive ? <Badge variant="secondary">Inativo</Badge> : null}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy || name.trim() === block.name}
                    onClick={() =>
                        void run(() =>
                            updateClientBlockAction(clientId, block.id, {
                                name: name.trim(),
                            }),
                        )
                    }
                >
                    Renomear
                </Button>
                {block.isActive ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                            void run(() =>
                                updateClientBlockAction(clientId, block.id, {
                                    isActive: false,
                                }),
                            )
                        }
                    >
                        Desativar
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                            void run(() =>
                                updateClientBlockAction(clientId, block.id, {
                                    isActive: true,
                                }),
                            )
                        }
                    >
                        Reativar
                    </Button>
                )}
            </div>
            <ul className="space-y-2">
                {block.units.map((unit) => (
                    <UnitRow
                        key={unit.id}
                        clientId={clientId}
                        unit={unit}
                        targets={targets.filter((target) => target.id !== unit.id)}
                        busy={busy}
                        run={run}
                    />
                ))}
            </ul>
            {block.isActive ? (
                <div className="grid gap-3 border-t pt-3 md:grid-cols-2">
                    <form
                        className="flex gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void run(async () => {
                                const result = await createClientUnitAction(
                                    clientId,
                                    block.id,
                                    unitName,
                                );
                                if (!("error" in result)) setUnitName("");
                                return result;
                            });
                        }}
                    >
                        <Input
                            value={unitName}
                            onChange={(event) => setUnitName(event.target.value)}
                            placeholder="Nova unidade"
                            disabled={busy}
                        />
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
                                    block.id,
                                    {
                                        start: Number(start),
                                        end: Number(end),
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
                            <Label htmlFor={`start-${block.id}`}>De</Label>
                            <Input
                                id={`start-${block.id}`}
                                inputMode="numeric"
                                value={start}
                                onChange={(event) => setStart(event.target.value)}
                                className="w-24"
                                disabled={busy}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`end-${block.id}`}>Até</Label>
                            <Input
                                id={`end-${block.id}`}
                                inputMode="numeric"
                                value={end}
                                onChange={(event) => setEnd(event.target.value)}
                                className="w-24"
                                disabled={busy}
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={
                                busy ||
                                start.trim() === "" ||
                                end.trim() === ""
                            }
                        >
                            Gerar intervalo
                        </Button>
                    </form>
                </div>
            ) : null}
        </div>
    );
}

function UnitRow({
    clientId,
    unit,
    targets,
    busy,
    run,
}: {
    clientId: string;
    unit: CatalogBlock["units"][number];
    targets: { id: string; label: string }[];
    busy: boolean;
    run: (
        task: () => Promise<{ error: string } | { success: true }>,
    ) => Promise<void>;
}) {
    const [name, setName] = useState(unit.name);
    const [targetId, setTargetId] = useState("");

    useEffect(() => {
        setName(unit.name);
    }, [unit.name]);

    return (
        <li className="flex flex-wrap items-center gap-2">
            <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="max-w-40"
                disabled={busy || !unit.isActive}
            />
            {!unit.isActive ? <Badge variant="secondary">Inativa</Badge> : null}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || name.trim() === unit.name}
                onClick={() =>
                    void run(() =>
                        updateClientUnitAction(clientId, unit.id, {
                            name: name.trim(),
                        }),
                    )
                }
            >
                Renomear
            </Button>
            {unit.isActive ? (
                <>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                            void run(() =>
                                updateClientUnitAction(clientId, unit.id, {
                                    isActive: false,
                                }),
                            )
                        }
                    >
                        Desativar
                    </Button>
                    <select
                        className={`${SELECT_CLASS} max-w-56`}
                        value={targetId}
                        disabled={busy}
                        onChange={(event) => setTargetId(event.target.value)}
                    >
                        <option value="">Unir em…</option>
                        {targets.map((target) => (
                            <option key={target.id} value={target.id}>
                                {target.label}
                            </option>
                        ))}
                    </select>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || !targetId}
                        onClick={() =>
                            void run(() =>
                                mergeClientUnitAction(clientId, unit.id, targetId),
                            )
                        }
                    >
                        Unir
                    </Button>
                </>
            ) : (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                        void run(() =>
                            updateClientUnitAction(clientId, unit.id, {
                                isActive: true,
                            }),
                        )
                    }
                >
                    Reativar
                </Button>
            )}
        </li>
    );
}
