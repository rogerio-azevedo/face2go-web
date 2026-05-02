"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleReaderActiveAction } from "@/app/company/leitores/actions";
import type { ClientListRow, ReaderListRow } from "@/types/domain";
import { ReaderForm } from "@/components/company/leitores/ReaderForm";
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
    READER_BRAND_LABELS,
    type ReaderBrandSlug,
} from "@/lib/validations/readers";

export function ReadersTable({
    readers,
    clients,
    canManage,
}: {
    readers: ReaderListRow[];
    clients: ClientListRow[];
    canManage: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editReader, setEditReader] = useState<ReaderListRow | null>(null);
    const [filterClientId, setFilterClientId] = useState<string>("");

    const filteredReaders = useMemo(() => {
        if (!filterClientId) return readers;
        return readers.filter((r) => r.clientId === filterClientId);
    }, [readers, filterClientId]);

    function openCreate() {
        setEditReader(null);
        setSheetOpen(true);
    }

    function openEdit(row: ReaderListRow) {
        setEditReader(row);
        setSheetOpen(true);
    }

    function toggleActive(readerId: string, isActive: boolean) {
        startTransition(async () => {
            const result = await toggleReaderActiveAction({
                readerId,
                isActive,
            });
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(
                isActive ? "Leitor reativado." : "Leitor desativado.",
            );
            router.refresh();
        });
    }

    const colSpan = canManage ? 7 : 6;

    return (
        <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                    <label
                        htmlFor="filter-client"
                        className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                    >
                        Cliente
                    </label>
                    <select
                        id="filter-client"
                        className="border-input bg-card text-foreground h-10 w-full rounded-md border px-3 text-sm shadow-sm"
                        value={filterClientId}
                        onChange={(e) => setFilterClientId(e.target.value)}
                    >
                        <option value="">Todos</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                {canManage ? (
                    <Button
                        type="button"
                        size="sm"
                        className="shrink-0 self-end sm:self-auto"
                        onClick={openCreate}
                    >
                        Novo leitor
                    </Button>
                ) : null}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Status</TableHead>
                            {canManage ? (
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            ) : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReaders.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    {readers.length === 0
                                        ? "Nenhum leitor cadastrado."
                                        : "Nenhum leitor para o filtro selecionado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReaders.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.clientName}
                                    </TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {READER_BRAND_LABELS[
                                                row.brand as ReaderBrandSlug
                                            ] ?? row.brand}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {row.ip}:{row.port}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {row.description ?? "—"}
                                    </TableCell>
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
                <ReaderForm
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    mode={editReader ? "edit" : "create"}
                    reader={editReader}
                    clients={clients}
                />
            ) : null}
        </>
    );
}
