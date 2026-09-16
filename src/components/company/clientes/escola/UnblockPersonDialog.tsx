"use client";

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

export function UnblockPersonDialog({
    open,
    onOpenChange,
    personName,
    busy,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    personName: string;
    busy: boolean;
    onConfirm: () => Promise<void>;
}) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next && !busy) onOpenChange(false);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Desbloquear {personName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        A face volta ao leitor com os horários normais e a
                        porta volta a abrir.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={busy}
                        onClick={(e) => {
                            e.preventDefault();
                            void onConfirm();
                        }}
                    >
                        {busy ? "Desbloqueando…" : "Desbloquear"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
