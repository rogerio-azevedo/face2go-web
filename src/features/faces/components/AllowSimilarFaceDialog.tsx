"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import { collidingPersonLabel } from "@/lib/similar-face-error";

export function AllowSimilarFaceDialog({
    open,
    onOpenChange,
    personName,
    error,
    busy,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    personName: string;
    error?: string | null;
    busy?: boolean;
    onConfirm: () => void;
}) {
    const who = collidingPersonLabel(error);
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Permitir face parecida?</AlertDialogTitle>
                    <AlertDialogDescription>
                        A trava de foto parecida dos leitores abre só durante o
                        envio de {personName} e volta em seguida.
                        {who ? ` Coincide com ${who}.` : ""}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={busy}
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                    >
                        Permitir e sincronizar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function AllowSimilarFaceButton({
    personName,
    error,
    disabled,
    onConfirm,
}: {
    personName: string;
    error?: string | null;
    disabled?: boolean;
    onConfirm: () => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                title="Enviar mesmo com face parecida a um cadastro já existente"
                onClick={() => setOpen(true)}
            >
                <ShieldAlert className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1.5">
                    Permitir face parecida
                </span>
            </Button>
            <AllowSimilarFaceDialog
                open={open}
                onOpenChange={(next) => {
                    if (!disabled) setOpen(next);
                }}
                personName={personName}
                error={error}
                busy={disabled}
                onConfirm={() => {
                    setOpen(false);
                    onConfirm();
                }}
            />
        </>
    );
}
