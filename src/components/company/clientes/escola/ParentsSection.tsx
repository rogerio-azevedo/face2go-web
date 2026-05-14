"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { ParentRow, StudentRow } from "@/types/domain";
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

import { ParentForm } from "./ParentForm";
import { ParentStudentsSheet } from "./ParentStudentsSheet";

export function ParentsSection({
    clientId,
    initialParents,
    students,
}: {
    clientId: string;
    initialParents: ParentRow[];
    students: StudentRow[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<ParentRow | null>(null);
    const [linksOpen, setLinksOpen] = useState(false);
    const [linkParentId, setLinkParentId] = useState<ParentRow | null>(null);

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
                    Novo responsável
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Acesso login</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialParents.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum responsável cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialParents.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>{row.phone ?? "—"}</TableCell>
                                    <TableCell>{row.document ?? "—"}</TableCell>
                                    <TableCell>
                                        {row.userId ? (
                                            <Badge>Sim</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                —
                                            </Badge>
                                        )}
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
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setLinkParentId(row);
                                                    setLinksOpen(true);
                                                }}
                                            >
                                                Alunos vinculados
                                            </Button>
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
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ParentForm
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                clientId={clientId}
                mode={editRow ? "edit" : "create"}
                parent={editRow}
                onSuccess={() => {
                    toast.success(
                        editRow
                            ? "Responsável atualizado."
                            : "Responsável cadastrado.",
                    );
                    refresh();
                }}
            />

            <ParentStudentsSheet
                open={linksOpen}
                onOpenChange={setLinksOpen}
                clientId={clientId}
                parent={linkParentId}
                students={students}
                onChanged={() => {
                    refresh();
                }}
            />
        </>
    );
}
