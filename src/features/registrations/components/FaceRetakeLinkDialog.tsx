"use client";

import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/** Dígitos prontos para wa.me, com DDI 55. */
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

function formatExpires(iso: string): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

export function FaceRetakeLinkDialog({
    open,
    onOpenChange,
    personName,
    phone,
    url,
    message,
    expiresAt,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    personName: string | null;
    phone: string | null;
    url: string;
    message: string;
    expiresAt: string;
}) {
    const expiresLabel = formatExpires(expiresAt);

    function copyText(text: string, success: string) {
        void navigator.clipboard.writeText(text).then(
            () => toast.success(success),
            () => toast.error("Não foi possível copiar."),
        );
    }

    function shareWhatsApp() {
        const text = encodeURIComponent(message);
        const number = toBrazilContactNumber(phone);
        const href = number
            ? `https://wa.me/${number}?text=${text}`
            : `https://wa.me/?text=${text}`;
        window.open(href, "_blank", "noopener,noreferrer");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Link para refazer a foto</DialogTitle>
                    <DialogDescription>
                        Uso único
                        {expiresLabel ? `, válido até ${expiresLabel}` : ""}.
                        {personName ? ` Envie para ${personName}.` : ""} O
                        cadastro atual é mantido — só a foto muda.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <p className="break-all font-mono text-xs">{url}</p>
                    <textarea
                        readOnly
                        value={message}
                        rows={5}
                        className="border-input bg-background w-full rounded-lg border px-2.5 py-2 text-sm"
                    />
                </div>
                <DialogFooter className="flex-row flex-wrap gap-2 sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => copyText(url, "Link copiado.")}
                    >
                        <Copy className="mr-1 size-3.5" />
                        Copiar link
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => copyText(message, "Mensagem copiada.")}
                    >
                        <Copy className="mr-1 size-3.5" />
                        Copiar mensagem
                    </Button>
                    <Button type="button" size="sm" onClick={shareWhatsApp}>
                        <MessageCircle className="mr-1 size-3.5" />
                        WhatsApp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
