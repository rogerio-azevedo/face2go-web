"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    initialClasses,
    shifts,
}: {
    clientId: string;
    initialClasses: SchoolClassRow[];
    shifts: ShiftRow[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<SchoolClassRow | null>(null);
    const [search, setSearch] = useState("");

    const filteredClasses = useMemo(() => {
        const term = normalizeSearch(search);
        if (!term) return initialClasses;
        return initialClasses.filter((row) =>
            normalizeSearch(row.name).includes(term),
        );
    }, [initialClasses, search]);

    function refresh() {
        startTransition(() => router.refresh());
    }

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

            <div className="rounded-md border">
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
                                    {initialClasses.length === 0
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
