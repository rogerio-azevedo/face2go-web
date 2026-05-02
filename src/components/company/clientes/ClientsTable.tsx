"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleClientActiveAction } from "@/app/company/clientes/actions";
import type { ClientListRow } from "@/types/domain";
import { ClientForm } from "@/components/company/clientes/ClientForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CLIENT_TYPE_LABELS,
    type ClientType,
} from "@/lib/validations/clients";

export function ClientsTable({
    clients,
    canManage,
}: {
    clients: ClientListRow[];
    canManage: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editClient, setEditClient] = useState<ClientListRow | null>(null);

    function openCreate() {
        setEditClient(null);
        setSheetOpen(true);
    }

    function openEdit(row: ClientListRow) {
        setEditClient(row);
        setSheetOpen(true);
    }

    function toggleActive(clientId: string, isActive: boolean) {
        startTransition(async () => {
            const result = await toggleClientActiveAction({ clientId, isActive });
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(
                isActive ? "Cliente reativado." : "Cliente desativado.",
            );
            router.refresh();
        });
    }

    return (
        <>
            <div className="flex flex-wrap justify-end gap-2">
                {canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                        Novo cliente
                    </Button>
                ) : null}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>CNPJ</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastro via link</TableHead>
                            {canManage ? (
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            ) : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={canManage ? 8 : 7}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum cliente cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>
                                        {CLIENT_TYPE_LABELS[row.type as ClientType] ??
                                            row.type}
                                    </TableCell>
                                    <TableCell>{row.cnpj ?? "—"}</TableCell>
                                    <TableCell>{row.phone ?? "—"}</TableCell>
                                    <TableCell>{row.email ?? "—"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {canManage ? (
                                                <Switch
                                                    checked={row.isActive}
                                                    disabled={pending}
                                                    onCheckedChange={(v) =>
                                                        toggleActive(
                                                            row.id,
                                                            v === true,
                                                        )
                                                    }
                                                />
                                            ) : null}
                                            {row.isActive ? (
                                                <Badge>Ativo</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Inativo
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/company/clientes/${row.id}/usuarios`}
                                            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                                        >
                                            Abrir
                                        </Link>
                                    </TableCell>
                                    {canManage ? (
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={pending}
                                                onClick={() => openEdit(row)}
                                            >
                                                Editar
                                            </Button>
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {canManage ? (
                <ClientForm
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    mode={editClient ? "edit" : "create"}
                    client={editClient}
                />
            ) : null}
        </>
    );
}
