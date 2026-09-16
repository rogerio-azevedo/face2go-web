"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Printer } from "lucide-react";
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
import { downloadQrSvgAsPng } from "@/features/registrations/lib/download-qr-png";
import { RegistrationLinkQrPoster } from "@/features/registrations/components/RegistrationLinkQrPoster";

export type RegistrationLinkQrTarget = {
    code: string;
    url: string;
};

export function RegistrationLinkQrDialog({
    open,
    onOpenChange,
    clientName,
    target,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientName: string;
    target: RegistrationLinkQrTarget | null;
}) {
    const previewQrRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    function handlePrint() {
        window.print();
    }

    async function handleDownloadPng() {
        const svg = previewQrRef.current?.querySelector("svg");
        if (!svg || !target) {
            toast.error("Não foi possível gerar o PNG.");
            return;
        }
        setDownloading(true);
        try {
            await downloadQrSvgAsPng(svg, `qr-cadastro-${target.code}.png`);
            toast.success("PNG baixado.");
        } catch {
            toast.error("Não foi possível gerar o PNG.");
        } finally {
            setDownloading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[min(90vh,52rem)] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cartaz de cadastro</DialogTitle>
                    <DialogDescription>
                        Imprima para colar na portaria ou baixe o QR em PNG
                        para usar na sua arte.
                    </DialogDescription>
                </DialogHeader>
                {target ? (
                    <RegistrationLinkQrPoster
                        clientName={clientName}
                        code={target.code}
                        url={target.url}
                        qrWrapperRef={previewQrRef}
                        variant="preview"
                    />
                ) : null}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadPng}
                        disabled={!target || downloading}
                    >
                        {downloading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Download className="size-4" />
                        )}
                        Baixar PNG
                    </Button>
                    <Button
                        type="button"
                        onClick={handlePrint}
                        disabled={!target}
                    >
                        <Printer className="size-4" />
                        Imprimir
                    </Button>
                </DialogFooter>
            </DialogContent>
            {open && target && typeof document !== "undefined"
                ? createPortal(
                      <div
                          id="registration-qr-print-root"
                          className="hidden print:flex"
                      >
                          <RegistrationLinkQrPoster
                              clientName={clientName}
                              code={target.code}
                              url={target.url}
                              variant="print"
                          />
                      </div>,
                      document.body,
                  )
                : null}
        </Dialog>
    );
}
