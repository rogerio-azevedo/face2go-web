"use client";

import { useState } from "react";

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
import { Label } from "@/components/ui/label";

export function BlockPersonDialog({
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
    onConfirm: (reason: string) => Promise<void>;
}) {
    const [reason, setReason] = useState("");
    const trimmed = reason.trim();
    const invalid = trimmed.length < 3;

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next && !busy) {
                    setReason("");
                    onOpenChange(false);
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bloquear {personName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        A face permanece no leitor no perfil Bloqueados — a
                        porta não abre. Toda tentativa gera alerta com foto e
                        este motivo.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="block-reason">Motivo do bloqueio</Label>
                    <textarea
                        id="block-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={busy}
                        rows={3}
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Obrigatório (mín. 3 caracteres)"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={busy || invalid}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={(e) => {
                            e.preventDefault();
                            if (invalid) return;
                            void onConfirm(trimmed).then(() => {
                                setReason("");
                            });
                        }}
                    >
                        {busy ? "Bloqueando…" : "Bloquear"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
