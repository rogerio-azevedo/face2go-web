"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { deferInEffect } from "@/lib/defer-in-effect";
import { REGISTRATION_LINK_NAME_MAX } from "@/lib/registration-link-schedule";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RenameRegistrationLinkDialog({
    open,
    onOpenChange,
    initialName,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialName: string | null;
    onSubmit: (
        name: string,
    ) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        deferInEffect(() => {
            if (open) {
                setName(initialName ?? "");
                setSubmitting(false);
            }
        });
    }, [open, initialName]);

    async function handleConfirm() {
        const trimmed = name.trim();
        if (trimmed.length > REGISTRATION_LINK_NAME_MAX) {
            toast.error("O nome pode ter no máximo 80 caracteres.");
            return;
        }
        setSubmitting(true);
        try {
            const result = await onSubmit(trimmed);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success(trimmed ? "Nome atualizado." : "Nome removido.");
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nome do link</DialogTitle>
                    <DialogDescription>
                        Um rótulo para distinguir este link na lista. Deixe em
                        branco para remover.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="rename-link-name">Nome</Label>
                    <Input
                        id="rename-link-name"
                        value={name}
                        maxLength={REGISTRATION_LINK_NAME_MAX}
                        placeholder="QR na porta, grupo do WhatsApp"
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                void handleConfirm();
                            }
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={() => void handleConfirm()}
                        disabled={submitting}
                    >
                        {submitting ? "Salvando…" : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
