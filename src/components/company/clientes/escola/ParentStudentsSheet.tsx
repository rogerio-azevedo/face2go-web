"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
    linkResponsibleStudentAction,
    listResponsibleStudentLinksAction,
    unlinkResponsibleStudentAction,
    updateResponsibleStudentLinkAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type {
    ResponsibleRow,
    ResponsibleStudentLinkWithStudent,
    ResponsibleRelationshipType,
    StudentRow,
} from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    RESPONSIBLE_RELATIONSHIP_VALUES,
    RELATIONSHIP_TYPE_LABELS,
} from "@/lib/validations/school";

export function ParentStudentsSheet({
    open,
    onOpenChange,
    clientId,
    parent,
    students,
    onChanged,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    parent: ResponsibleRow | null;
    students: StudentRow[];
    onChanged?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [items, setItems] = useState<ResponsibleStudentLinkWithStudent[]>([]);

    const [pickStudentId, setPickStudentId] = useState("");
    const [relType, setRelType] = useState<ResponsibleRelationshipType>("other");
    const [authorizedPickup, setAuthorizedPickup] = useState(true);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!parent) return;
        await Promise.resolve();
        setLoading(true);
        try {
            const r = await listResponsibleStudentLinksAction(clientId, parent.id);
            if ("error" in r) {
                toast.error(r.error);
                setItems([]);
                return;
            }
            setItems(r.items);
        } finally {
            setLoading(false);
        }
    }, [clientId, parent]);

    useEffect(() => {
        if (!(open && parent)) return undefined;
        const id = window.setTimeout(() => {
            void load();
        }, 0);
        return () => window.clearTimeout(id);
    }, [open, parent, load]);

    useEffect(() => {
        if (!open) {
            setEditingStudentId(null);
            setPickStudentId("");
            setRelType("other");
            setAuthorizedPickup(true);
        }
    }, [open]);

    const linkedIds = useMemo(
        () => new Set(items.map((x) => x.link.studentId)),
        [items],
    );

    const availableStudents = useMemo(
        () => students.filter((s) => !linkedIds.has(s.id)),
        [students, linkedIds],
    );

    const studentSelectOptions = useMemo(() => {
        if (editingStudentId) {
            const s = students.find((x) => x.id === editingStudentId);
            return s ? [s] : [];
        }
        return availableStudents;
    }, [editingStudentId, students, availableStudents]);

    async function onUnlink(studentId: string) {
        if (!parent) return;
        setBusy(true);
        try {
            const r = await unlinkResponsibleStudentAction(
                clientId,
                parent.id,
                studentId,
            );
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            toast.success("Vínculo removido.");
            await load();
            onChanged?.();
        } finally {
            setBusy(false);
        }
    }

    function startEdit(row: ResponsibleStudentLinkWithStudent) {
        setEditingStudentId(row.student.id);
        setPickStudentId(row.student.id);
        setRelType(
            row.link.relationshipType as ResponsibleRelationshipType,
        );
        setAuthorizedPickup(row.link.isAuthorizedPickup);
    }

    function cancelEdit() {
        setEditingStudentId(null);
        setPickStudentId("");
        setRelType("other");
        setAuthorizedPickup(true);
    }

    async function onLink() {
        if (!parent || !pickStudentId) {
            toast.error("Selecione um aluno.");
            return;
        }
        setBusy(true);
        try {
            if (editingStudentId) {
                const r = await updateResponsibleStudentLinkAction(
                    clientId,
                    parent.id,
                    pickStudentId,
                    {
                        relationshipType: relType,
                        isAuthorizedPickup: authorizedPickup,
                    },
                );
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
                toast.success("Alterações salvas.");
                cancelEdit();
            } else {
                const r = await linkResponsibleStudentAction(clientId, parent.id, {
                    studentId: pickStudentId,
                    relationshipType: relType,
                    isAuthorizedPickup: authorizedPickup,
                });
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
                toast.success("Aluno vinculado.");
                setPickStudentId("");
                setRelType("other");
                setAuthorizedPickup(true);
            }
            await load();
            onChanged?.();
        } finally {
            setBusy(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="gap-0 sm:!w-[640px] sm:!max-w-none">
                <SheetHeader className="border-b px-6 pb-4">
                    <SheetTitle>
                        Alunos — {parent?.name ?? "…"}
                    </SheetTitle>
                </SheetHeader>

                {loading ? (
                    <div className="text-muted-foreground flex items-center gap-2 px-6 py-6 text-sm">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando…
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                                                        <TableHead className="w-32">Parentesco</TableHead>
                                                                        <TableHead className="w-24">Retirada</TableHead>
                                                                        <TableHead className="w-52 text-right">
                                                                            Ações
                                                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-muted-foreground py-8 text-center text-sm"
                                            >
                                                Nenhum vínculo ainda.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((row) => (
                                            <TableRow key={row.link.id}>
                                                <TableCell className="font-medium">
                                                    {row.student.name}
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        RELATIONSHIP_TYPE_LABELS[
                                                            row.link
                                                                .relationshipType as ResponsibleRelationshipType
                                                        ]
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {row.link
                                                        .isAuthorizedPickup
                                                        ? "Sim"
                                                        : "Não"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            className="shrink-0"
                                                                                            disabled={
                                                                                                busy ||
                                                                                                editingStudentId !== null
                                                                                            }
                                                                                            onClick={() =>
                                                                                                startEdit(
                                                                                                    row,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Editar
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="destructive"
                                                                                            size="sm"
                                                                                            className="shrink-0"
                                                                                            disabled={
                                                                                                busy ||
                                                                                                editingStudentId !== null
                                                                                            }
                                                                                            onClick={() =>
                                                                                                onUnlink(
                                                                                                    row
                                                                                                        .student
                                                                                                        .id,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Remover
                                                                                        </Button>
                                                                                    </div>
                                                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium">
                                {editingStudentId ? "Editar vínculo" : "Novo vínculo"}
                            </h3>
                            <div className="grid gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="lnk-student">Aluno</Label>
                                    <select
                                        id="lnk-student"
                                        className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm disabled:opacity-70"
                                        value={pickStudentId}
                                        onChange={(e) =>
                                            setPickStudentId(e.target.value)
                                        }
                                        disabled={
                                            !!editingStudentId ||
                                            busy ||
                                            studentSelectOptions.length === 0
                                        }
                                    >
                                        <option value="">
                                            {studentSelectOptions.length === 0
                                                ? editingStudentId
                                                    ? "Aluno não encontrado"
                                                    : "Nenhum aluno disponível"
                                                : "Selecione"}
                                        </option>
                                        {studentSelectOptions.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} — {s.enrollment}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lnk-rel">
                                        Parentesco
                                    </Label>
                                    <select
                                        id="lnk-rel"
                                        className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                                        value={relType}
                                        onChange={(e) =>
                                            setRelType(
                                                e.target
                                                    .value as ResponsibleRelationshipType,
                                            )
                                        }
                                        disabled={busy}
                                    >
                                        {RESPONSIBLE_RELATIONSHIP_VALUES.map((v) => (
                                            <option key={v} value={v}>
                                                {RELATIONSHIP_TYPE_LABELS[v]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="lnk-ap"
                                        checked={authorizedPickup}
                                        onCheckedChange={(c) =>
                                            setAuthorizedPickup(c === true)
                                        }
                                        disabled={busy}
                                    />
                                    <Label
                                        htmlFor="lnk-ap"
                                        className="font-normal text-sm"
                                    >
                                        Autorizado a retirar o aluno
                                    </Label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editingStudentId ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={busy}
                                            onClick={() => cancelEdit()}
                                            className="shrink-0"
                                        >
                                            Cancelar
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => void onLink()}
                                        className="min-w-0 flex-1"
                                    >
                                        {busy ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : editingStudentId ? (
                                            "Salvar alterações"
                                        ) : (
                                            "Vincular"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
