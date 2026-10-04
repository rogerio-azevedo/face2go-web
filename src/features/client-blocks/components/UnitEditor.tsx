"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { deleteClientUnitAction, updateClientUnitAction } from "../actions";
import type { CatalogBlock, CatalogUnit } from "../types";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { UnitPeople } from "./UnitPeople";

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
    catalog,
    canMovePeople = false,
}: {
    clientId: string;
    blockName: string;
    unit: CatalogUnit;
    busy: boolean;
    run: RunTask;
    onClose: () => void;
    catalog: CatalogBlock[];
    canMovePeople?: boolean;
}) {
    const [name, setName] = useState(unit.name);
    const [showPeople, setShowPeople] = useState(false);

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
            {!unit.isActive ? (
                <ConfirmDeleteButton
                    label="Excluir"
                    title={`Excluir a unidade ${unit.name}?`}
                    description="A unidade será apagada definitivamente. Só é possível se nenhuma pessoa (nem inativa) estiver vinculada a ela."
                    busy={busy}
                    onConfirm={() =>
                        void run(() => deleteClientUnitAction(clientId, unit.id))
                    }
                />
            ) : null}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPeople((value) => !value)}
            >
                {showPeople ? "Ocultar pessoas" : "Ver pessoas"}
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
            {showPeople ? (
                <UnitPeople
                    clientId={clientId}
                    unit={unit}
                    catalog={catalog}
                    canMove={canMovePeople}
                    busy={busy}
                    run={run}
                />
            ) : null}
        </div>
    );
}
