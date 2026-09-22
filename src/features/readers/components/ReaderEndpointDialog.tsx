"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ReaderEndpointDialog({
    readerName,
    endpoint,
}: {
    readerName: string;
    endpoint: string;
}) {
    const [open, setOpen] = useState(false);

    async function copyEndpoint() {
        try {
            await navigator.clipboard.writeText(endpoint);
            toast.success("Endereço copiado.");
        } catch {
            toast.error("Não foi possível copiar.");
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium uppercase"
                onClick={() => setOpen(true)}
            >
                Ver
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Endereço</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm font-medium">{readerName}</p>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={endpoint}
                            className="font-mono text-sm"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => void copyEndpoint()}
                            aria-label="Copiar endereço"
                        >
                            <Copy className="size-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
