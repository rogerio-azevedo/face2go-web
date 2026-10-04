"use client";

import { useState } from "react";

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

export function ConfirmDeleteButton({
    label,
    title,
    description,
    busy,
    onConfirm,
    confirmLabel = "Excluir",
    triggerVariant = "destructive",
}: {
    label: string;
    title: string;
    description: string;
    busy: boolean;
    onConfirm: () => void;
    confirmLabel?: string;
    triggerVariant?: "destructive" | "outline" | "ghost";
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant={triggerVariant}
                size="sm"
                disabled={busy}
                onClick={() => setOpen(true)}
            >
                {label}
            </Button>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent size="default">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={busy}
                            onClick={() => {
                                setOpen(false);
                                onConfirm();
                            }}
                        >
                            {confirmLabel}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
