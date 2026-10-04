"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { updateClientUnitAction } from "../actions";
import type { CatalogUnit } from "../types";

export type RunTask = (
    task: () => Promise<{ error: string } | { success: true }>,
) => Promise<void>;

/** Remonte com `key` ao trocar de unidade ou após salvar, para reiniciar o campo. */
export function UnitEditor({
    clientId,
    blockName,
    unit,
    busy,
    run,
    onClose,
}: {
    clientId: string;
    blockName: string;
    unit: CatalogUnit;
    busy: boolean;
    run: RunTask;
    onClose: () => void;
}) {
    const [name, setName] = useState(unit.name);

    return (
        <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border p-3">
            <span className="text-muted-foreground text-sm">
                Bloco {blockName} · Unidade
            </span>
            <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="max-w-40"
                disabled={busy || !unit.isActive}
                aria-label="Nome da unidade"
            />
            {!unit.isActive ? <Badge variant="secondary">Inativa</Badge> : null}
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || !unit.isActive || name.trim() === unit.name}
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
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                    void run(() =>
                        updateClientUnitAction(clientId, unit.id, {
                            isActive: !unit.isActive,
                        }),
                    )
                }
            >
                {unit.isActive ? "Desativar" : "Reativar"}
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={onClose}
            >
                Fechar
            </Button>
        </div>
    );
}
