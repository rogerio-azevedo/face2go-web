"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    deleteClientVehicleAction,
    listClientVehiclesAction,
    syncClientVehicleLprAction,
} from "@/app/company/clientes/[clientId]/usuarios/vehicles-actions";
import { DeviceSyncStatusBadge } from "@/components/company/clientes/escola/DeviceSyncStatusBadge";
import { isPartialSyncError } from "@/lib/face-sync-result";
import { deferInEffect } from "@/lib/defer-in-effect";
import type { PaginatedResponse, VehicleRow } from "@/types/domain";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { SearchInput } from "@/components/ui/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { VehicleForm } from "./VehicleForm";

export function VehiclesSection({
    clientId,
    initialVehicles,
}: {
    clientId: string;
    initialVehicles: PaginatedResponse<VehicleRow>;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [list, setList] = useState(initialVehicles);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(initialVehicles.page);
    const [loading, setLoading] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<VehicleRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<VehicleRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const fetchList = useCallback(
        async (nextPage: number, nextSearch: string) => {
            setLoading(true);
            try {
                const r = await listClientVehiclesAction(clientId, {
                    page: nextPage,
                    pageSize: list.pageSize,
                    search: nextSearch || undefined,
                });
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
                setList(r.result);
            } finally {
                setLoading(false);
            }
        },
        [clientId, list.pageSize],
    );

    useEffect(() => {
        deferInEffect(() => {
            setList(initialVehicles);
            setPage(initialVehicles.page);
        });
    }, [initialVehicles]);

    useEffect(() => {
        deferInEffect(() => {
            void fetchList(page, search);
        });
    }, [page, search, fetchList]);

    function refresh() {
        startTransition(() => router.refresh());
        void fetchList(page, search);
    }

    function onSearchChange(value: string) {
        setSearch(value);
        setPage(1);
    }

    async function confirmDelete() {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            const r = await deleteClientVehicleAction(
                clientId,
                pendingDelete.id,
            );
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            toast.success("Veículo removido.");
            setPendingDelete(null);
            refresh();
        } finally {
            setDeleting(false);
        }
    }

    async function handleSyncLpr(row: VehicleRow) {
        setSyncingId(row.id);
        try {
            const r = await syncClientVehicleLprAction(clientId, row.id);
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            if (r.lprSyncStatus === "sync_failed") {
                toast.error(r.lprSyncError ?? "Falha ao sincronizar placa.");
            } else if (
                r.lprSyncStatus === "synced" &&
                isPartialSyncError(r.lprSyncError)
            ) {
                toast.warning(
                    r.lprSyncError ?? "Sincronizado parcialmente com as câmeras.",
                );
            } else {
                toast.success("Placa sincronizada com as câmeras LPR.");
            }
            refresh();
        } finally {
            setSyncingId(null);
        }
    }

    const tableBusy = loading || isPending;

    return (
        <>
            <div className="mb-4 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                    <SearchInput
                        id="search-vehicles"
                        value={search}
                        onValueChange={onSearchChange}
                        placeholder="Buscar por placa, marca ou modelo…"
                        disabled={tableBusy}
                        className="w-full sm:max-w-md"
                    />
                    <Button
                        type="button"
                        size="default"
                        className="w-full shrink-0 sm:w-auto"
                        onClick={() => {
                            setEditRow(null);
                            setSheetOpen(true);
                        }}
                    >
                        Novo veículo
                    </Button>
                </div>
            </div>

            <div className="relative rounded-md border">
                {tableBusy ? (
                    <div
                        className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-md"
                        aria-hidden
                    >
                        <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                ) : null}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Placa</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Cor</TableHead>
                            <TableHead>Condutor</TableHead>
                            <TableHead>LPR</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    {search
                                        ? "Nenhum veículo encontrado."
                                        : "Nenhum veículo cadastrado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            list.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono font-semibold tracking-wide">
                                        {row.plate}
                                    </TableCell>
                                    <TableCell>{row.brand}</TableCell>
                                    <TableCell>{row.model}</TableCell>
                                    <TableCell>{row.color}</TableCell>
                                    <TableCell>{row.driverName}</TableCell>
                                    <TableCell>
                                        <DeviceSyncStatusBadge
                                            status={
                                                row.lprSyncStatus ??
                                                "pending_sync"
                                            }
                                            hasFace
                                            error={row.lprSyncError}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    syncingId === row.id ||
                                                    tableBusy
                                                }
                                                title="Sincronizar placa com as câmeras LPR"
                                                onClick={() =>
                                                    void handleSyncLpr(row)
                                                }
                                            >
                                                {syncingId === row.id ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="size-4" />
                                                )}
                                                <span className="sr-only sm:not-sr-only sm:ml-1.5">
                                                    Sincronizar
                                                </span>
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
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() =>
                                                    setPendingDelete(row)
                                                }
                                            >
                                                Excluir
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                page={list.page}
                pageSize={list.pageSize}
                total={list.total}
                disabled={tableBusy}
                onPageChange={setPage}
            />

            <VehicleForm
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                clientId={clientId}
                mode={editRow ? "edit" : "create"}
                vehicle={editRow}
                onSuccess={() => {
                    toast.success(
                        editRow ? "Veículo atualizado." : "Veículo cadastrado.",
                    );
                    refresh();
                }}
            />

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete
                                ? `Isso remove permanentemente o veículo de placa ${pendingDelete.plate}.`
                                : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault();
                                void confirmDelete();
                            }}
                        >
                            {deleting ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
