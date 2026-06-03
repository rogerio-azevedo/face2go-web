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

type FaceSyncOfferModalProps = {
    open: boolean;
    personName: string;
    onConfirm: () => void;
    onDismiss: () => void;
};

export function FaceSyncOfferModal({
    open,
    personName,
    onConfirm,
    onDismiss,
}: FaceSyncOfferModalProps) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onDismiss();
            }}
        >
            <AlertDialogContent className="max-w-md sm:max-w-md">
                <AlertDialogHeader className="text-left">
                    <AlertDialogTitle>
                        Sincronizar com os leitores faciais?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left">
                        As alterações em <strong>{personName}</strong> precisam
                        ser enviadas aos leitores faciais (nome, horários de
                        acesso ou vínculos com turmas/alunos). Deseja
                        sincronizar agora?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onDismiss}>
                        Agora não
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        Sincronizar agora
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
