"use client";

import Link from "next/link";
import { MonitorPlay } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleClientActiveAction } from "@/app/company/clientes/actions";
import type { ClientListRow } from "@/types/domain";
import { ClientForm } from "@/components/company/clientes/ClientForm";
import { ClientTvDisplaySheet } from "@/components/company/clientes/ClientTvDisplaySheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ClientsMobileList } from "@/features/clients/components/ClientsMobileList";
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
import { cn } from "@/lib/utils";

export function ClientsTable({
    clients,
    canManage,
    showDisplayPanel,
}: {
    clients: ClientListRow[];
    canManage: boolean;
    showDisplayPanel: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editClient, setEditClient] = useState<ClientListRow | null>(null);
    const [tvClient, setTvClient] = useState<ClientListRow | null>(null);

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

    const emptyColSpan =
        6 + (showDisplayPanel ? 1 : 0) + (canManage ? 1 : 0);

    return (
        <>
            <div className="flex flex-wrap justify-end gap-2">
                {canManage ? (
                    <Button type="button" size="sm" onClick={openCreate}>
                        Novo cliente
                    </Button>
                ) : null}
            </div>

            <ClientsMobileList
                clients={clients}
                canManage={canManage}
                showDisplayPanel={showDisplayPanel}
                pending={pending}
                onToggleActive={toggleActive}
                onOpenDisplay={setTvClient}
                onOpenEdit={openEdit}
            />

            <div className="hidden min-w-0 max-w-full overflow-hidden rounded-md border min-[1440px]:block">
                <Table className="table-fixed [&_td]:whitespace-normal">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="w-[176px]">CNPJ</TableHead>
                            <TableHead className="w-[160px]">Telefone</TableHead>
                            <TableHead className="w-[80px]">Status</TableHead>
                            <TableHead className="w-[104px]">Gerenciar</TableHead>
                            {showDisplayPanel ? (
                                <TableHead className="w-[120px] text-center">
                                    TV
                                </TableHead>
                            ) : null}
                            {canManage ? (
                                <TableHead className="w-[104px] text-right">
                                    Ações
                                </TableHead>
                            ) : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={emptyColSpan}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum cliente cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="break-words font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>
                                        {CLIENT_TYPE_LABELS[row.type as ClientType] ??
                                            row.type}
                                        {row.segment === "condo_market" ? (
                                            <span className="text-muted-foreground block text-xs">
                                                Mercado em condomínio
                                            </span>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="break-all">{row.cnpj ?? "—"}</TableCell>
                                    <TableCell>{row.phone ?? "—"}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={row.isActive}
                                            disabled={pending || !canManage}
                                            aria-label={
                                                canManage
                                                    ? `${row.isActive ? "Desativar" : "Ativar"} cliente ${row.name}`
                                                    : `Cliente ${row.name} ${row.isActive ? "ativo" : "inativo"}`
                                            }
                                            onCheckedChange={(v) =>
                                                toggleActive(row.id, v === true)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/company/clientes/${row.id}/usuarios`}
                                            aria-disabled={pending}
                                            tabIndex={pending ? -1 : 0}
                                            className={cn(
                                                buttonVariants({
                                                    variant: "outline",
                                                    size: "sm",
                                                }),
                                                pending &&
                                                "pointer-events-none opacity-50",
                                            )}
                                        >
                                            Abrir
                                        </Link>
                                    </TableCell>
                                    {showDisplayPanel ? (
                                        <TableCell className="text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1 text-teal-600 hover:text-teal-700"
                                                disabled={pending}
                                                onClick={() =>
                                                    setTvClient(row)
                                                }
                                            >
                                                <MonitorPlay
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                                Display
                                            </Button>
                                        </TableCell>
                                    ) : null}
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

            <ClientTvDisplaySheet
                client={
                    tvClient
                        ? { id: tvClient.id, name: tvClient.name }
                        : null
                }
                open={tvClient !== null}
                onOpenChange={(o) => {
                    if (!o) {
                        setTvClient(null);
                    }
                }}
            />
        </>
    );
}
