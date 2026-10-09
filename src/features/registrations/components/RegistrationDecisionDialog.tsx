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

export type RegistrationDecision = "reject" | "block" | "unblock";

const DECISION_COPY: Record<
    RegistrationDecision,
    {
        title: string;
        description: (name: string) => string;
        placeholder: string;
        label: string;
        action: string;
        pending: string;
        variant: "destructive" | "outline" | "default";
        min: number;
    }
> = {
    reject: {
        title: "Rejeitar cadastro?",
        description: (name) => `Recusa ${name}. O motivo é opcional.`,
        placeholder: "Descreva o motivo, se quiser…",
        label: "Motivo da rejeição",
        action: "Rejeitar",
        pending: "Rejeitando…",
        variant: "destructive",
        min: 0,
    },
    block: {
        title: "Bloquear cadastro?",
        description: (name) =>
            `${name} continua no leitor, mas a porta não abre. O motivo é obrigatório.`,
        placeholder: "Descreva o motivo do bloqueio…",
        label: "Motivo do bloqueio",
        action: "Bloquear",
        pending: "Bloqueando…",
        variant: "outline",
        min: 3,
    },
    unblock: {
        title: "Desbloquear cadastro?",
        description: (name) =>
            `${name} volta ao leitor com acesso normal e a porta volta a abrir. O motivo é opcional.`,
        placeholder: "Descreva o motivo, se quiser…",
        label: "Motivo do desbloqueio",
        action: "Desbloquear",
        pending: "Desbloqueando…",
        variant: "default",
        min: 0,
    },
};

type RegistrationDecisionDialogProps = {
    open: boolean;
    kind: RegistrationDecision | null;
    personName: string | null;
    wasApproved: boolean;
    pending: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (notes: string) => void;
};

export function RegistrationDecisionDialog({
    open,
    kind,
    personName,
    wasApproved,
    pending,
    onOpenChange,
    onConfirm,
}: RegistrationDecisionDialogProps) {
    const [notes, setNotes] = useState("");
    const copy = DECISION_COPY[kind ?? "reject"];
    const name = personName ?? "Este cadastro";

    function confirm() {
        const value = notes.trim();
        if (value.length < copy.min) {
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
                    <AlertDialogTitle>{copy.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {kind === "reject" && wasApproved
                            ? `${name} irá para Rejeitados e a face será removida dos leitores. O motivo é opcional.`
                            : copy.description(name)}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-[72px] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3"
                    placeholder={copy.placeholder}
                    aria-label={copy.label}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={
                            pending || notes.trim().length < copy.min
                        }
                        variant={copy.variant}
                        onClick={(event) => {
                            event.preventDefault();
                            confirm();
                        }}
                    >
                        {pending ? copy.pending : copy.action}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
