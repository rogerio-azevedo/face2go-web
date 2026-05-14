"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { SchoolClassRow, ShiftRow } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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

    function refresh() {
        startTransition(() => router.refresh());
    }

    return (
        <>
            <div className="flex justify-end gap-2 mb-2">
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
                            <TableHead>Turno</TableHead>
                            <TableHead>Ano</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialClasses.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhuma turma cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialClasses.map((row) => (
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
