"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
    linkResponsibleStudentAction,
    listResponsiblesAction,
    listStudentResponsiblesAction,
    unlinkResponsibleStudentAction,
    updateResponsibleStudentLinkAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import type {
    ResponsibleRelationshipType,
    ResponsibleRow,
    StudentResponsibleLinkWithResponsible,
    StudentRow,
} from "@/types/domain";
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
import {
    RESPONSIBLE_RELATIONSHIP_VALUES,
    RELATIONSHIP_TYPE_LABELS,
} from "@/lib/validations/school";

export function StudentLinkedResponsiblesPanel({
    clientId,
    student,
    active,
    onChanged,
}: {
    clientId: string;
    student: StudentRow;
    active: boolean;
    onChanged?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [items, setItems] = useState<StudentResponsibleLinkWithResponsible[]>(
        [],
    );
    const [linkSearch, setLinkSearch] = useState("");
    const [linkOptions, setLinkOptions] = useState<ResponsibleRow[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [pickResponsibleId, setPickResponsibleId] = useState("");
    const [relType, setRelType] = useState<ResponsibleRelationshipType>("other");
    const [authorizedPickup, setAuthorizedPickup] = useState(true);
    const [editingResponsibleId, setEditingResponsibleId] = useState<
        string | null
    >(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await listStudentResponsiblesAction(clientId, student.id);
            if ("error" in r) {
                toast.error(r.error);
                setItems([]);
                return;
            }
            setItems(r.items);
        } finally {
            setLoading(false);
        }
    }, [clientId, student.id]);

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
                setEditingResponsibleId(null);
                setPickResponsibleId("");
                setRelType("other");
                setAuthorizedPickup(true);
                setLinkSearch("");
            }
        });
    }, [active]);

    useEffect(() => {
        if (!active || editingResponsibleId) return undefined;
        const t = window.setTimeout(() => {
            void (async () => {
                setOptionsLoading(true);
                try {
                    const r = await listResponsiblesAction(clientId, {
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
    }, [active, clientId, linkSearch, editingResponsibleId]);

    const linkedIds = useMemo(
        () => new Set(items.map((x) => x.link.responsibleId)),
        [items],
    );

    const availableResponsibles = useMemo(
        () => linkOptions.filter((r) => !linkedIds.has(r.id)),
        [linkOptions, linkedIds],
    );

    const responsibleSelectOptions = useMemo(() => {
        if (editingResponsibleId) {
            const fromLink = items.find(
                (x) => x.responsible.id === editingResponsibleId,
            )?.responsible;
            return fromLink ? [fromLink] : [];
        }
        return availableResponsibles;
    }, [editingResponsibleId, items, availableResponsibles]);

    async function onUnlink(responsibleId: string) {
        setBusy(true);
        try {
            const r = await unlinkResponsibleStudentAction(
                clientId,
                responsibleId,
                student.id,
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

    function startEdit(row: StudentResponsibleLinkWithResponsible) {
        setEditingResponsibleId(row.responsible.id);
        setPickResponsibleId(row.responsible.id);
        setRelType(row.link.relationshipType as ResponsibleRelationshipType);
        setAuthorizedPickup(row.link.isAuthorizedPickup);
    }

    function cancelEdit() {
        setEditingResponsibleId(null);
        setPickResponsibleId("");
        setRelType("other");
        setAuthorizedPickup(true);
    }

    async function onLink() {
        if (!pickResponsibleId) {
            toast.error("Selecione um responsável.");
            return;
        }
        setBusy(true);
        try {
            if (editingResponsibleId) {
                const r = await updateResponsibleStudentLinkAction(
                    clientId,
                    pickResponsibleId,
                    student.id,
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
                const r = await linkResponsibleStudentAction(
                    clientId,
                    pickResponsibleId,
                    {
                        studentId: student.id,
                        relationshipType: relType,
                        isAuthorizedPickup: authorizedPickup,
                    },
                );
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
                toast.success("Responsável vinculado.");
                setPickResponsibleId("");
                setRelType("other");
                setAuthorizedPickup(true);
            }
            await load();
            onChanged?.();
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Carregando responsáveis…
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium">Responsáveis vinculados</h3>
            <div className="rounded-md border">
                <Table className="w-full table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[35%]">Responsável</TableHead>
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
                                        {row.responsible.name}
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
                                                    busy ||
                                                    editingResponsibleId !== null
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
                                                    busy ||
                                                    editingResponsibleId !== null
                                                }
                                                onClick={() =>
                                                    void onUnlink(
                                                        row.responsible.id,
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

            <div className="space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium">
                    {editingResponsibleId ? "Editar vínculo" : "Novo vínculo"}
                </h4>
                <div className="grid gap-3">
                    {!editingResponsibleId ? (
                        <SearchInput
                            id="lnk-responsible-search"
                            value={linkSearch}
                            onValueChange={setLinkSearch}
                            placeholder="Buscar responsável para vincular…"
                            disabled={busy || optionsLoading}
                        />
                    ) : null}
                    <div className="space-y-2">
                        <Label htmlFor="lnk-responsible">Responsável</Label>
                        <SearchableSelect
                            id="lnk-responsible"
                            options={responsibleSelectOptions.map((r) => ({
                                value: r.id,
                                label:
                                    r.name +
                                    (r.document ? ` — ${r.document}` : ""),
                            }))}
                            value={pickResponsibleId}
                            onChange={setPickResponsibleId}
                            placeholder={
                                responsibleSelectOptions.length === 0
                                    ? editingResponsibleId
                                        ? "Responsável não encontrado"
                                        : "Nenhum responsável disponível"
                                    : "Buscar responsável..."
                            }
                            isDisabled={!!editingResponsibleId || busy}
                            noOptionsMessage="Nenhum responsável encontrado"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lnk-rel-student">Parentesco</Label>
                        <select
                            id="lnk-rel-student"
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
                            id="lnk-ap-student"
                            checked={authorizedPickup}
                            onCheckedChange={(c) =>
                                setAuthorizedPickup(c === true)
                            }
                            disabled={busy}
                        />
                        <Label
                            htmlFor="lnk-ap-student"
                            className="font-normal text-sm"
                        >
                            Autorizado a retirar o aluno
                        </Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {editingResponsibleId ? (
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
                            ) : editingResponsibleId ? (
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
