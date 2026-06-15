"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
    linkResponsibleStudentAction,
    listResponsibleStudentLinksAction,
    listStudentsAction,
    unlinkResponsibleStudentAction,
    updateResponsibleStudentLinkAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type {
    ResponsibleRelationshipType,
    ResponsibleRow,
    ResponsibleStudentLinkWithStudent,
    StudentRow,
} from "@/types/domain";
import { deferInEffect } from "@/lib/defer-in-effect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchInput } from "@/components/ui/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { buildFaceSyncSaveHint, type FaceSyncSaveHint } from "@/lib/face-sync-after-edit";
import {
    RESPONSIBLE_RELATIONSHIP_VALUES,
    RELATIONSHIP_TYPE_LABELS,
} from "@/lib/validations/school";

export function ParentLinkedStudentsPanel({
    clientId,
    parent,
    active,
    onChanged,
    onFaceSyncOffer,
}: {
    clientId: string;
    parent: ResponsibleRow;
    active: boolean;
    onChanged?: () => void;
    onFaceSyncOffer?: (hint?: FaceSyncSaveHint) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [items, setItems] = useState<ResponsibleStudentLinkWithStudent[]>([]);
    const [linkSearch, setLinkSearch] = useState("");
    const [linkOptions, setLinkOptions] = useState<StudentRow[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [pickStudentId, setPickStudentId] = useState("");
    const [relType, setRelType] = useState<ResponsibleRelationshipType>("other");
    const [authorizedPickup, setAuthorizedPickup] = useState(true);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

    const load = useCallback(async () => {
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
    }, [clientId, parent.id]);

    useEffect(() => {
        if (!active) return undefined;
        const id = window.setTimeout(() => {
            void load();
        }, 0);
        return () => window.clearTimeout(id);
    }, [active, load]);

    useEffect(() => {
        deferInEffect(() => {
            if (!active) {
                setEditingStudentId(null);
                setPickStudentId("");
                setRelType("other");
                setAuthorizedPickup(true);
                setLinkSearch("");
            }
        });
    }, [active]);

    useEffect(() => {
        if (!active || editingStudentId) return undefined;
        const t = window.setTimeout(() => {
            void (async () => {
                setOptionsLoading(true);
                try {
                    const r = await listStudentsAction(clientId, {
                        search: linkSearch || undefined,
                        page: 1,
                        pageSize: 50,
                    });
                    if ("error" in r) {
                        toast.error(r.error);
                        setLinkOptions([]);
                        return;
                    }
                    setLinkOptions(r.result.data);
                } finally {
                    setOptionsLoading(false);
                }
            })();
        }, linkSearch ? 400 : 0);
        return () => window.clearTimeout(t);
    }, [active, clientId, linkSearch, editingStudentId]);

    const linkedIds = useMemo(
        () => new Set(items.map((x) => x.link.studentId)),
        [items],
    );

    const availableStudents = useMemo(
        () => linkOptions.filter((s) => !linkedIds.has(s.id)),
        [linkOptions, linkedIds],
    );

    const studentSelectOptions = useMemo(() => {
        if (editingStudentId) {
            const fromLink = items.find((x) => x.student.id === editingStudentId)
                ?.student;
            return fromLink ? [fromLink] : [];
        }
        return availableStudents;
    }, [editingStudentId, items, availableStudents]);

    async function onUnlink(studentId: string) {
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
            onFaceSyncOffer?.(buildFaceSyncSaveHint(parent, true));
        } finally {
            setBusy(false);
        }
    }

    function startEdit(row: ResponsibleStudentLinkWithStudent) {
        setEditingStudentId(row.student.id);
        setPickStudentId(row.student.id);
        setRelType(row.link.relationshipType as ResponsibleRelationshipType);
        setAuthorizedPickup(row.link.isAuthorizedPickup);
    }

    function cancelEdit() {
        setEditingStudentId(null);
        setPickStudentId("");
        setRelType("other");
        setAuthorizedPickup(true);
    }

    async function onLink() {
        if (!pickStudentId) {
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
            onFaceSyncOffer?.(buildFaceSyncSaveHint(parent, true));
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Carregando alunos vinculados…
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium">Alunos vinculados</h3>
            <div className="rounded-md border">
                <Table className="w-full table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[35%]">Aluno</TableHead>
                            <TableHead className="w-[22%]">Parentesco</TableHead>
                            <TableHead className="w-[13%]">Retirada</TableHead>
                            <TableHead className="w-[30%] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-muted-foreground py-6 text-center text-sm"
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
                                        {row.link.isAuthorizedPickup ? "Sim" : "Não"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-wrap justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    busy || editingStudentId !== null
                                                }
                                                onClick={() => startEdit(row)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                disabled={
                                                    busy || editingStudentId !== null
                                                }
                                                onClick={() =>
                                                    void onUnlink(row.student.id)
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

            <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium">
                    {editingStudentId ? "Editar vínculo" : "Novo vínculo"}
                </h4>
                <div className="grid gap-3">
                    {!editingStudentId ? (
                        <SearchInput
                            id="lnk-student-search"
                            value={linkSearch}
                            onValueChange={setLinkSearch}
                            placeholder="Buscar aluno para vincular…"
                            disabled={busy || optionsLoading}
                        />
                    ) : null}
                    <div className="space-y-2">
                        <Label htmlFor="lnk-student">Aluno</Label>
                        <SearchableSelect
                            id="lnk-student"
                            options={studentSelectOptions.map((s) => ({
                                value: s.id,
                                label: `${s.name} — ${s.enrollment}`,
                            }))}
                            value={pickStudentId}
                            onChange={setPickStudentId}
                            placeholder={
                                studentSelectOptions.length === 0
                                    ? editingStudentId
                                        ? "Aluno não encontrado"
                                        : "Nenhum aluno disponível"
                                    : "Buscar aluno..."
                            }
                            isDisabled={!!editingStudentId || busy}
                            noOptionsMessage="Nenhum aluno encontrado"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lnk-rel">Parentesco</Label>
                        <select
                            id="lnk-rel"
                            className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                            value={relType}
                            onChange={(e) =>
                                setRelType(
                                    e.target.value as ResponsibleRelationshipType,
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
                        <Label htmlFor="lnk-ap" className="font-normal text-sm">
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
                            >
                                Cancelar
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void onLink()}
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
    );
}
