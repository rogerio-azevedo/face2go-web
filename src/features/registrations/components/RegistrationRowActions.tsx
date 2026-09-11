"use client";

import { Eye, MoreHorizontal, Pencil, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import type { ClientRegistrationListRow } from "@/types/domain";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ListTab = "draft" | "approved" | "rejected" | "deleted";

export function RegistrationRowActions({
    row,
    tab,
    isAdmin,
    busy,
    onView,
    onSync,
    onEdit,
    onDelete,
    onRestore,
}: {
    row: ClientRegistrationListRow;
    tab: ListTab;
    isAdmin: boolean;
    busy: boolean;
    onView: () => void;
    onSync: () => void;
    onEdit: () => void;
    onDelete: () => Promise<void>;
    onRestore: () => Promise<void>;
}) {
    const [confirm, setConfirm] = useState<"delete" | "restore" | null>(null);
    const [working, setWorking] = useState(false);

    const isDeleted = tab === "deleted" || row.isActive === false;
    const isApproved = row.status === "approved" && !isDeleted;
    const canSync = isApproved && row.faceId != null;
    const canEdit = isApproved;
    const canDelete = isAdmin && isApproved;
    const canRestore = isAdmin && isDeleted;

    async function run(kind: "delete" | "restore") {
        setWorking(true);
        try {
            if (kind === "delete") await onDelete();
            else await onRestore();
            setConfirm(null);
        } finally {
            setWorking(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Ações"
                            disabled={busy || working}
                        >
                            <MoreHorizontal />
                        </Button>
                    }
                />
                <DropdownMenuContent align="end" className="w-auto min-w-40">
                    <DropdownMenuItem onClick={onView}>
                        <Eye />
                        Visualizar
                    </DropdownMenuItem>
                    {canSync ? (
                        <DropdownMenuItem onClick={onSync}>
                            <RefreshCw />
                            Sincronizar
                        </DropdownMenuItem>
                    ) : null}
                    {canEdit ? (
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil />
                            Editar
                        </DropdownMenuItem>
                    ) : null}
                    {canDelete || canRestore ? <DropdownMenuSeparator /> : null}
                    {canDelete ? (
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setConfirm("delete")}
                        >
                            <Trash2 />
                            Excluir
                        </DropdownMenuItem>
                    ) : null}
                    {canRestore ? (
                        <DropdownMenuItem onClick={() => setConfirm("restore")}>
                            <RotateCcw />
                            Restaurar
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog
                open={confirm != null}
                onOpenChange={(open) => {
                    if (!open && !working) setConfirm(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm === "restore"
                                ? "Restaurar cadastro?"
                                : "Excluir cadastro?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm === "restore"
                                ? "O cadastro volta a ficar ativo e a face é reenviada aos leitores."
                                : "Remove o acesso nos leitores. O cadastro pode ser restaurado depois."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={working}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={working}
                            variant={
                                confirm === "delete" ? "destructive" : "default"
                            }
                            onClick={(e) => {
                                e.preventDefault();
                                if (confirm) void run(confirm);
                            }}
                        >
                            {working
                                ? confirm === "restore"
                                    ? "Restaurando…"
                                    : "Excluindo…"
                                : confirm === "restore"
                                  ? "Restaurar"
                                  : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
