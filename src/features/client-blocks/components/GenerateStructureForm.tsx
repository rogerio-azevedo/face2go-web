"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodFirstMessage } from "@/lib/actions/zod-utils";

import { generateClientStructureAction } from "../actions";
import {
    floorUnitNames,
    generateStructureSchema,
    type GenerateStructureInput,
} from "../validations";

function describe(input: GenerateStructureInput) {
    const blocks = input.blockEnd - input.blockStart + 1;
    const units = floorUnitNames(input);
    const pad = (n: number) => String(n).padStart(input.blockDigits, "0");
    const firstFloor = units.slice(0, input.unitsPerFloor);
    const lastFloor = units.slice(-input.unitsPerFloor);
    const floors =
        input.floorStart === input.floorEnd
            ? `${firstFloor[0]}-${firstFloor.at(-1)}`
            : `${firstFloor[0]}-${firstFloor.at(-1)} ... ${lastFloor[0]}-${lastFloor.at(-1)}`;
    return `${blocks} bloco(s) x ${units.length} unidade(s) = ${blocks * units.length} (blocos ${pad(input.blockStart)} a ${pad(input.blockEnd)}; ${floors})`;
}

const FIELDS = [
    { key: "blockStart", label: "Bloco inicial" },
    { key: "blockEnd", label: "Bloco final" },
    { key: "blockDigits", label: "Dígitos do bloco" },
    { key: "floorStart", label: "Primeiro andar" },
    { key: "floorEnd", label: "Último andar" },
    { key: "unitsPerFloor", label: "Aptos por andar" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export function GenerateStructureForm({
    clientId,
    busy,
    onDone,
}: {
    clientId: string;
    busy: boolean;
    onDone: () => Promise<void>;
}) {
    const [values, setValues] = useState<Record<FieldKey, string>>({
        blockStart: "1",
        blockEnd: "",
        blockDigits: "2",
        floorStart: "1",
        floorEnd: "",
        unitsPerFloor: "",
    });
    const [running, setRunning] = useState(false);

    const parsed = generateStructureSchema.safeParse(values);
    const ready = Object.values(values).every((value) => value.trim() !== "");

    async function submit() {
        if (!parsed.success) {
            toast.error(zodFirstMessage(parsed.error));
            return;
        }
        setRunning(true);
        try {
            const result = await generateClientStructureAction(
                clientId,
                parsed.data,
            );
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            const skippedBlocks =
                result.inactiveBlocksSkipped.length > 0
                    ? ` Blocos inativos ignorados: ${result.inactiveBlocksSkipped.join(", ")}.`
                    : "";
            toast.success(
                `${result.blocksCreated} bloco(s) e ${result.unitsCreated} unidade(s) criados; ${result.unitsSkipped} já existiam.${skippedBlocks}`,
            );
            await onDone();
        } finally {
            setRunning(false);
        }
    }

    return (
        <form
            className="space-y-3 rounded-lg border p-4"
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >
            <div>
                <h3 className="font-semibold">Gerar estrutura</h3>
                <p className="text-muted-foreground text-sm">
                    Cria os blocos e os apartamentos por andar de uma vez. A
                    unidade é andar x 100 + posição (andar 2, 4 por andar: 201 a
                    204). O que já existe é mantido.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1">
                        <Label htmlFor={`structure-${field.key}`}>
                            {field.label}
                        </Label>
                        <Input
                            id={`structure-${field.key}`}
                            inputMode="numeric"
                            value={values[field.key]}
                            disabled={busy || running}
                            onChange={(event) =>
                                setValues((current) => ({
                                    ...current,
                                    [field.key]: event.target.value,
                                }))
                            }
                        />
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-muted-foreground text-sm">
                    {!ready
                        ? "Preencha os campos para ver a prévia."
                        : parsed.success
                          ? describe(parsed.data)
                          : zodFirstMessage(parsed.error)}
                </p>
                <Button
                    type="submit"
                    className="sm:ml-auto"
                    disabled={busy || running || !ready || !parsed.success}
                >
                    {running ? "Gerando…" : "Gerar estrutura"}
                </Button>
            </div>
        </form>
    );
}
