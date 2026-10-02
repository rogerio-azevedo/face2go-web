"use client";

import { useState } from "react";
import { toast } from "sonner";

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

export type RegistrationDecision = "reject" | "block";

type RegistrationDecisionDialogProps = {
    open: boolean;
    kind: RegistrationDecision | null;
    personName: string | null;
    pending: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (notes: string) => void;
};

export function RegistrationDecisionDialog({
    open,
    kind,
    personName,
    pending,
    onOpenChange,
    onConfirm,
}: RegistrationDecisionDialogProps) {
    const [notes, setNotes] = useState("");
    const isBlock = kind === "block";

    function confirm() {
        const value = notes.trim();
        if (isBlock && value.length < 3) {
            toast.error("Informe o motivo do bloqueio (mínimo 3 caracteres).");
            return;
        }
        onConfirm(value);
    }

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next && pending) return;
                onOpenChange(next);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isBlock ? "Bloquear cadastro?" : "Rejeitar cadastro?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isBlock
                            ? `${personName ?? "Este cadastro"} continua no leitor, mas a porta não abre. O motivo é obrigatório.`
                            : `Recusa ${personName ?? "este cadastro"}. O motivo é opcional.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-[72px] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3"
                    placeholder={
                        isBlock
                            ? "Descreva o motivo do bloqueio…"
                            : "Descreva o motivo, se quiser…"
                    }
                    aria-label={isBlock ? "Motivo do bloqueio" : "Motivo da rejeição"}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={pending || (isBlock && notes.trim().length < 3)}
                        variant={isBlock ? "outline" : "destructive"}
                        onClick={(event) => {
                            event.preventDefault();
                            confirm();
                        }}
                    >
                        {pending
                            ? isBlock
                                ? "Bloqueando…"
                                : "Rejeitando…"
                            : isBlock
                              ? "Bloquear"
                              : "Rejeitar"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
