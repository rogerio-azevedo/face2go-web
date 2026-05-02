"use client";

import { useState } from "react";
import { toast } from "sonner";

import { softDeleteCompanyAction } from "@/app/super-admin/companies/actions";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
    companyId: string;
    companyName: string;
    disabled?: boolean;
};

export function DeleteCompanyButton({ companyId, companyName, disabled }: Props) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);

    async function handleConfirm() {
        setPending(true);
        const result = await softDeleteCompanyAction(companyId);
        setPending(false);
        if ("error" in result) {
            toast.error(result.error);
            return;
        }
        toast.success("Empresa desativada.");
        setOpen(false);
    }

    return (
        <>
            <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={disabled ?? false}
                onClick={() => setOpen(true)}
            >
                Desativar
            </Button>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent size="default">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desativar empresa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A empresa <strong>{companyName}</strong> ficará
                            inativa. Usuários e clientes vinculados permanecem
                            nos registros para integridade dos dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => void handleConfirm()}
                        >
                            {pending ? "Salvando..." : "Confirmar desativação"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
