"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { listSchoolClassesAction } from "@/features/school/actions/school-classes";
import { listShiftsAction } from "@/app/company/clientes/[clientId]/usuarios/shifts-actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import type { SchoolClassRow, ShiftRow } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { normalizeSearch } from "@/lib/utils/search";
import { schoolClassTurnLabel } from "@/lib/validations/school";

import { SchoolClassForm } from "./SchoolClassForm";

export function SchoolClassesSection({
    clientId,
}: {
    clientId: string;
}) {
    const [, startTransition] = useTransition();
    const [classes, setClasses] = useState<SchoolClassRow[]>([]);
    const [shifts, setShifts] = useState<ShiftRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<SchoolClassRow | null>(null);
    const [search, setSearch] = useState("");

    const filteredClasses = useMemo(() => {
        const term = normalizeSearch(search);
        if (!term) return classes;
        return classes.filter((row) =>
            normalizeSearch(row.name).includes(term),
        );
    }, [classes, search]);

    function refresh() {
        startTransition(async () => {
            setLoading(true);
            const [clsRes, shRes] = await Promise.all([
                listSchoolClassesAction(clientId),
                listShiftsAction(clientId),
            ]);
            if ("error" in clsRes) toast.error(clsRes.error);
            else setClasses(clsRes.items);
            if (!("error" in shRes)) setShifts(shRes.items);
            setLoading(false);
        });
    }

    useEffect(() => {
        deferInEffect(() => {
            void (async () => {
                setLoading(true);
                const [clsRes, shRes] = await Promise.all([
                    listSchoolClassesAction(clientId),
                    listShiftsAction(clientId),
                ]);
                if ("error" in clsRes) toast.error(clsRes.error);
                else setClasses(clsRes.items);
                if (!("error" in shRes)) setShifts(shRes.items);
                setLoading(false);
            })();
        });
    }, [clientId]);

    return (
        <>
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput
                    id="search-classes"
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Filtrar por nome da turma…"
                    className="sm:max-w-sm"
                />
                <Button
                    type="button"
                    size="default"
                    onClick={() => {
                        setEditRow(null);
                        setSheetOpen(true);
                    }}
                >
                    Nova turma
                </Button>
            </div>

            <div className="relative rounded-md border">
                {loading ? (
                    <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-md">
                        <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                ) : null}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Horário</TableHead>
                            <TableHead>Ano</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClasses.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    {classes.length === 0
                                        ? "Nenhuma turma cadastrada."
                                        : "Nenhuma turma encontrada."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClasses.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>
                                        {schoolClassTurnLabel(row)}
                                    </TableCell>
                                    <TableCell>{row.year}</TableCell>
                                    <TableCell>
                                        {row.isActive ? (
                                            <Badge>Ativa</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inativa
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditRow(row);
                                                setSheetOpen(true);
                                            }}
                                        >
                                            Editar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <SchoolClassForm
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                clientId={clientId}
                mode={editRow ? "edit" : "create"}
                schoolClass={editRow}
                shifts={shifts}
                onSuccess={() => {
                    toast.success(
                        editRow ? "Turma atualizada." : "Turma criada.",
                    );
                    refresh();
                }}
            />
        </>
    );
}
