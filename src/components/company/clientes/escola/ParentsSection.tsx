"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import type { ResponsibleRow, StudentRow } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaceCirclePhoto } from "@/components/ui/face-circle-photo";
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
    initialResponsibles,
    students,
}: {
    clientId: string;
    initialResponsibles: ResponsibleRow[];
    students: StudentRow[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<ResponsibleRow | null>(null);
    const [linksOpen, setLinksOpen] = useState(false);
    const [linkParentId, setLinkParentId] = useState<ResponsibleRow | null>(null);

    function refresh() {
        startTransition(() => router.refresh());
    }

    useEffect(() => {
        console.log(
            "[ParentsSection] responsáveis",
            initialResponsibles.map((row) => ({
                id: row.id,
                name: row.name,
                photoKey: row.photoKey,
                photoUrl: row.photoUrl,
            })),
        );
    }, [initialResponsibles]);

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
                            <TableHead className="w-[52px]" aria-label="Foto" />
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
                        {initialResponsibles.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum responsável cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialResponsibles.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="align-middle">
                                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                                            <FaceCirclePhoto
                                                className="size-full"
                                                photoUrl={
                                                    row.photoUrl ?? null
                                                }
                                                nameHint={row.name}
                                            />
                                        </div>
                                    </TableCell>
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
