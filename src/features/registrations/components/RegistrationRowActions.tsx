"use client";

import {
    Camera,
    Eye,
    MessageCircle,
    MoreHorizontal,
    Pencil,
    Phone,
    RefreshCw,
    RotateCcw,
    Trash2,
} from "lucide-react";
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

type ListTab = "draft" | "approved" | "rejected" | "blocked" | "deleted";

/** Dígitos prontos para wa.me / tel:, com DDI 55. */
function toBrazilContactNumber(phone: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    if (
        (digits.length === 12 || digits.length === 13) &&
        digits.startsWith("55")
    ) {
        return digits;
    }
    return null;
}

export function RegistrationRowActions({
    row,
    tab,
    isAdmin,
    busy,
    onView,
    onSync,
    onForceSync,
    onEdit,
    onRetake,
    onDelete,
    onRestore,
}: {
    row: ClientRegistrationListRow;
    tab: ListTab;
    isAdmin: boolean;
    busy: boolean;
    onView: () => void;
    onSync: () => void;
    onForceSync: () => void;
    onEdit: () => void;
    onRetake: () => void;
    onDelete: () => Promise<void>;
    onRestore: () => Promise<void>;
}) {
    const [confirm, setConfirm] = useState<"delete" | "restore" | null>(null);
    const [working, setWorking] = useState(false);

    const contactNumber = toBrazilContactNumber(row.phone);
    const isDeleted = tab === "deleted" || row.isActive === false;
    const isApproved = row.status === "approved" && !isDeleted;
    const canSync = isApproved && row.faceId != null;
    const canEdit = isApproved || (row.status === "draft" && !isDeleted);
    const canRetake =
        !isDeleted &&
        (row.status === "draft" || row.status === "approved");
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
                    {canRetake ? (
                        <DropdownMenuItem onClick={onRetake}>
                            <Camera />
                            Refazer foto
                        </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                        disabled={!contactNumber}
                        onClick={() => {
                            if (!contactNumber) return;
                            window.open(
                                `https://wa.me/${contactNumber}`,
                                "_blank",
                                "noopener,noreferrer",
                            );
                        }}
                    >
                        <MessageCircle />
                        WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={!contactNumber}
                        onClick={() => {
                            if (!contactNumber) return;
                            window.location.href = `tel:+${contactNumber}`;
                        }}
                    >
                        <Phone />
                        Ligar
                    </DropdownMenuItem>
                    {canSync ? (
                        <>
                            <DropdownMenuItem onClick={onSync}>
                                <RefreshCw />
                                Sincronizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onForceSync}>
                                <RotateCcw />
                                Forçar sincronização
                            </DropdownMenuItem>
                        </>
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
                    {row.deviceSyncError ? (
                        <>
                            <DropdownMenuSeparator />
                            <p className="text-destructive max-w-72 px-2 py-1.5 text-xs whitespace-normal">
                                {row.deviceSyncError}
                            </p>
                        </>
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
