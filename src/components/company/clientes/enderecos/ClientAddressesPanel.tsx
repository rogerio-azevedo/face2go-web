"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { MapPin, Pencil, Star, Trash2 } from "lucide-react";

import {
    deleteClientAddressAction,
    listClientAddressesAction,
    setPrimaryClientAddressAction,
} from "@/app/company/clientes/[clientId]/enderecos/actions";
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
import { formatAddressLine, type ClientAddressRow } from "@/types/client-address";

import { AddressFormDialog } from "./AddressFormDialog";

export function ClientAddressesPanel({
    clientId,
    initialAddresses,
    canEdit = true,
}: {
    clientId: string;
    initialAddresses: ClientAddressRow[];
    canEdit?: boolean;
}) {
    const router = useRouter();
    const [addresses, setAddresses] = useState(initialAddresses);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ClientAddressRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ClientAddressRow | null>(
        null,
    );
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        setAddresses(initialAddresses);
    }, [initialAddresses]);

    const refresh = () => {
        router.refresh();
    };

    const reloadAddresses = () => {
        startTransition(async () => {
            const result = await listClientAddressesAction(clientId);
            if (result.ok) {
                setAddresses(result.data);
            }
            refresh();
        });
    };

    const handleSetPrimary = (addressId: string) => {
        startTransition(async () => {
            const result = await setPrimaryClientAddressAction(
                clientId,
                addressId,
            );
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            setAddresses((prev) =>
                prev.map((a) => ({
                    ...a,
                    isPrimary: a.id === addressId,
                })),
            );
            toast.success("Endereço principal atualizado.");
            reloadAddresses();
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        startTransition(async () => {
            const result = await deleteClientAddressAction(
                clientId,
                deleteTarget.id,
            );
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            setAddresses((prev) =>
                prev.filter((a) => a.id !== deleteTarget.id),
            );
            toast.success("Endereço excluído.");
            setDeleteTarget(null);
            reloadAddresses();
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                    Cadastre endereços com localização para uso em monitoramento
                    e recursos de mapa.
                </p>
                {canEdit ? (
                    <Button
                        onClick={() => {
                            setEditing(null);
                            setDialogOpen(true);
                        }}
                    >
                        <MapPin className="size-4" />
                        Novo endereço
                    </Button>
                ) : null}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Rótulo</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Coordenadas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {addresses.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-muted-foreground py-8 text-center"
                            >
                                Nenhum endereço cadastrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        addresses.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {row.label}
                                        </span>
                                        {row.isPrimary ? (
                                            <Badge variant="secondary">
                                                Principal
                                            </Badge>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell>{formatAddressLine(row)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {row.latitude != null && row.longitude != null
                                        ? `${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}`
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    {canEdit ? (
                                        <div className="flex justify-end gap-1">
                                            {!row.isPrimary ? (
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    title="Marcar como principal"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        handleSetPrimary(row.id)
                                                    }
                                                >
                                                    <Star className="size-4" />
                                                </Button>
                                            ) : null}
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                title="Editar"
                                                onClick={() => {
                                                    setEditing(row);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                title="Excluir"
                                                onClick={() =>
                                                    setDeleteTarget(row)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <AddressFormDialog
                clientId={clientId}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initial={editing}
                onSaved={() => {
                    reloadAddresses();
                    setEditing(null);
                }}
            />

            <AlertDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir endereço?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={pending}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
