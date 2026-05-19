"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteClientVehicleAction } from "@/app/company/clientes/[clientId]/usuarios/vehicles-actions";
import type { VehicleRow } from "@/types/domain";
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
    initialVehicles: VehicleRow[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<VehicleRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<VehicleRow | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    function refresh() {
        startTransition(() => router.refresh());
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

    return (
        <>
            <div className="space-y-2">
                <p className="text-muted-foreground max-w-xl text-sm">
                    Veículos cadastrados para liberação por placa (LPR). Cadastre
                    a placa vinculada ao condutor (responsável).
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        size="default"
                        onClick={() => {
                            setEditRow(null);
                            setSheetOpen(true);
                        }}
                    >
                        Novo veículo
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Placa</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Cor</TableHead>
                            <TableHead>Condutor</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialVehicles.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum veículo cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialVehicles.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono font-semibold tracking-wide">
                                        {row.plate}
                                    </TableCell>
                                    <TableCell>{row.brand}</TableCell>
                                    <TableCell>{row.model}</TableCell>
                                    <TableCell>{row.color}</TableCell>
                                    <TableCell>{row.driverName}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-wrap justify-end gap-2">
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
