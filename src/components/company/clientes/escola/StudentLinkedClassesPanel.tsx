"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
    getStudentByIdAction,
    linkStudentClassAction,
    listSchoolClassesAction,
    unlinkStudentClassAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { SchoolClassRow, StudentClassRow, StudentRow } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { buildFaceSyncSaveHint, type FaceSyncSaveHint } from "@/lib/face-sync-after-edit";
import { schoolClassTurnLabel } from "@/lib/validations/school";

function formatClassLabel(row: {
    name?: string;
    className?: string;
    year: number;
    linkedShiftName?: string | null;
    shift?: SchoolClassRow["shift"];
}) {
    const turn = schoolClassTurnLabel({
        linkedShiftName: row.linkedShiftName ?? null,
        shift: row.shift ?? null,
    });
    const label = row.name ?? row.className ?? "Turma";
    return `${label} — ${turn} / ${row.year}`;
}

export function StudentLinkedClassesPanel({
    clientId,
    student,
    active,
    onChanged,
    onFaceSyncOffer,
}: {
    clientId: string;
    student: StudentRow;
    active: boolean;
    onChanged?: () => void;
    onFaceSyncOffer?: (hint?: FaceSyncSaveHint) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [items, setItems] = useState<StudentClassRow[]>([]);
    const [classOptions, setClassOptions] = useState<SchoolClassRow[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [pickClassIds, setPickClassIds] = useState<string[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await getStudentByIdAction(clientId, student.id);
            if ("error" in r) {
                toast.error(r.error);
                setItems([]);
                return;
            }
            setItems((r.student.classes ?? []).filter((c) => c.isActive));
        } finally {
            setLoading(false);
        }
    }, [clientId, student.id]);

    const loadOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const r = await listSchoolClassesAction(clientId);
            if ("error" in r) {
                toast.error(r.error);
                setClassOptions([]);
                return;
            }
            setClassOptions(r.items.filter((c) => c.isActive));
        } finally {
            setOptionsLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        if (!active) return undefined;
        const id = window.setTimeout(() => {
            void load();
            void loadOptions();
        }, 0);
        return () => window.clearTimeout(id);
    }, [active, load, loadOptions]);

    useEffect(() => {
        if (!active) {
            setPickClassIds([]);
        }
    }, [active]);

    const linkedClassIds = useMemo(
        () => new Set(items.map((item) => item.classId)),
        [items],
    );

    const availableClasses = useMemo(
        () => classOptions.filter((c) => !linkedClassIds.has(c.id)),
        [classOptions, linkedClassIds],
    );

    async function onUnlink(classId: string) {
        setBusy(true);
        try {
            const r = await unlinkStudentClassAction(
                clientId,
                student.id,
                classId,
            );
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            toast.success("Turma desvinculada.");
            await load();
            onChanged?.();
            onFaceSyncOffer?.(buildFaceSyncSaveHint(student, true));
        } finally {
            setBusy(false);
        }
    }

    async function onLink() {
        if (pickClassIds.length === 0) {
            toast.error("Selecione ao menos uma turma.");
            return;
        }
        setBusy(true);
        try {
            let linked = 0;
            for (const classId of pickClassIds) {
                const r = await linkStudentClassAction(clientId, student.id, {
                    classId,
                });
                if ("error" in r) {
                    toast.error(r.error);
                    if (linked > 0) {
                        await load();
                        onChanged?.();
                    }
                    return;
                }
                linked += 1;
            }
            toast.success(
                linked === 1
                    ? "Turma vinculada."
                    : `${linked} turmas vinculadas.`,
            );
            setPickClassIds([]);
            await load();
            onChanged?.();
            onFaceSyncOffer?.(buildFaceSyncSaveHint(student, true));
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Carregando turmas…
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium">Turmas vinculadas</h3>
            <div className="rounded-md border">
                <Table className="w-full table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[55%]">Turma</TableHead>
                            <TableHead className="w-[20%]">Ano</TableHead>
                            <TableHead className="w-[25%] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="text-muted-foreground py-6 text-center text-sm"
                                >
                                    Nenhuma turma vinculada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {formatClassLabel(row)}
                                    </TableCell>
                                    <TableCell>{row.year}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            disabled={busy}
                                            onClick={() => void onUnlink(row.classId)}
                                        >
                                            Remover
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium">Novo vínculo</h4>
                <div className="grid gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="lnk-class">Turmas</Label>
                        <SearchableMultiSelect
                            id="lnk-class"
                            options={availableClasses.map((c) => ({
                                value: c.id,
                                label: formatClassLabel(c),
                            }))}
                            value={pickClassIds}
                            onChange={setPickClassIds}
                            placeholder={
                                optionsLoading
                                    ? "Carregando turmas..."
                                    : availableClasses.length === 0
                                      ? "Nenhuma turma disponível"
                                      : "Selecionar turmas..."
                            }
                            isDisabled={busy || optionsLoading}
                            noOptionsMessage="Nenhuma turma encontrada"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            disabled={busy || optionsLoading}
                            onClick={() => void onLink()}
                        >
                            {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                "Vincular"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
