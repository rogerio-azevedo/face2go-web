"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import type { SchoolClassRow, StudentRow } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaceCirclePhoto } from "@/components/ui/face-circle-photo";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { schoolClassTurnLabel } from "@/lib/validations/school";

import { StudentForm } from "./StudentForm";

function classesLabel(
    classes: SchoolClassRow[],
    studentClasses: StudentRow["classes"],
): string {
    const active = (studentClasses ?? []).filter((c) => c.isActive);
    if (active.length === 0) return "—";

    return active
        .map((link) => {
            const meta = classes.find((c) => c.id === link.classId);
            const turn = meta ? schoolClassTurnLabel(meta) : link.linkedShiftName ?? "—";
            return `${link.className} (${turn}, ${link.year})`;
        })
        .join(" · ");
}

export function StudentsSection({
    clientId,
    classes,
    initialStudents,
}: {
    clientId: string;
    classes: SchoolClassRow[];
    initialStudents: StudentRow[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [filterClassId, setFilterClassId] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<StudentRow | null>(null);

    const studentsWithClasses = useMemo(
        () =>
            initialStudents.map((s) => ({
                ...s,
                classes: s.classes ?? [],
            })),
        [initialStudents],
    );

    function refresh() {
        startTransition(() => router.refresh());
    }

    const rows = useMemo(() => {
        if (!filterClassId) return studentsWithClasses;
        return studentsWithClasses.filter((s) =>
            s.classes.some(
                (c) => c.isActive && c.classId === filterClassId,
            ),
        );
    }, [filterClassId, studentsWithClasses]);

    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-2">
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <Label htmlFor="filter-class" className="text-muted-foreground">
                        Filtrar por turma
                    </Label>
                    <select
                        id="filter-class"
                        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full min-w-[200px] rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-72"
                        value={filterClassId}
                        onChange={(e) => setFilterClassId(e.target.value)}
                    >
                        <option value="">Todas</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} — {schoolClassTurnLabel(c)} / {c.year}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    type="button"
                    size="default"
                    className="self-end"
                    onClick={() => {
                        setEditRow(null);
                        setSheetOpen(true);
                    }}
                >
                    Novo aluno
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[52px]" aria-label="Foto" />
                            <TableHead>Nome</TableHead>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Turmas</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum aluno neste filtro.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="align-middle">
                                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                                            <FaceCirclePhoto
                                                className="size-full"
                                                photoUrl={row.photoUrl ?? null}
                                                nameHint={row.name}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>{row.enrollment}</TableCell>
                                    <TableCell className="max-w-[280px] text-sm">
                                        {classesLabel(classes, row.classes)}
                                    </TableCell>
                                    <TableCell>
                                        {row.isActive ? (
                                            <Badge>Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inativo
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

            <StudentForm
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                clientId={clientId}
                mode={editRow ? "edit" : "create"}
                student={editRow}
                onSuccess={() => {
                    toast.success(
                        editRow ? "Aluno atualizado." : "Aluno cadastrado.",
                    );
                    refresh();
                }}
            />
        </>
    );
}
