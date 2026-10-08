"use client";

import { Copy, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    refreshReaderDeviceInfoAction,
    type ReaderDeviceInfoResult,
} from "@/features/readers/actions/device-info";

type ReaderDetailsDialogProps = {
    readerId: string;
    readerName: string;
    model: string | null;
    serialNumber: string | null;
    firmwareVersion: string | null;
    syncedAt: string | null;
    lastError: string | null;
    triggerLabel?: string;
    triggerVariant?: "ghost" | "outline";
    triggerClassName?: string;
};

function formatSyncedAt(value: string | null): string {
    if (!value) return "Nunca consultado";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {label}
            </dt>
            <dd className="min-w-0 break-words text-sm font-medium">
                {value || "Não informado"}
            </dd>
        </div>
    );
}

export function ReaderDetailsDialog(props: ReaderDetailsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<ReaderDeviceInfoResult>({
        model: props.model,
        serialNumber: props.serialNumber,
        firmwareVersion: props.firmwareVersion,
        syncedAt: props.syncedAt ?? "",
    });
    const [error, setError] = useState(props.lastError);
    const hasPreviousConsult = Boolean(details.syncedAt);

    async function refreshDetails() {
        setLoading(true);
        try {
            const result = await refreshReaderDeviceInfoAction(props.readerId);
            if (!result.ok) {
                setError(result.error);
                toast.error(result.error);
                return;
            }
            setDetails(result.data);
            setError(null);
            toast.success("Informações do equipamento atualizadas.");
        } finally {
            setLoading(false);
        }
    }

    async function copySerial() {
        if (!details.serialNumber) return;
        try {
            await navigator.clipboard.writeText(details.serialNumber);
            toast.success("Número de série copiado.");
        } catch {
            toast.error("Não foi possível copiar.");
        }
    }

    return (
        <>
            <Button
                type="button"
                variant={props.triggerVariant ?? "ghost"}
                size="sm"
                className={cn(
                    "h-8 px-2 text-xs font-medium uppercase",
                    props.triggerClassName,
                )}
                aria-label={`${props.triggerLabel ?? "Ver detalhes"} do leitor ${props.readerName}`}
                onClick={() => setOpen(true)}
            >
                {props.triggerLabel ?? "Ver"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do leitor</DialogTitle>
                        <DialogDescription>{props.readerName}</DialogDescription>
                    </DialogHeader>

                    <dl className="rounded-md border px-4">
                        <DetailRow label="Modelo" value={details.model} />
                        <DetailRow
                            label="Firmware"
                            value={details.firmwareVersion}
                        />
                        <div className="grid gap-1 border-b py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                            <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                Número de série
                            </dt>
                            <dd className="flex min-w-0 items-center gap-2 text-sm font-medium">
                                <span className="min-w-0 break-all">
                                    {details.serialNumber || "Não informado"}
                                </span>
                                {details.serialNumber ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0"
                                        onClick={() => void copySerial()}
                                        aria-label="Copiar número de série"
                                    >
                                        <Copy className="size-3.5" />
                                    </Button>
                                ) : null}
                            </dd>
                        </div>
                        <DetailRow
                            label="Última consulta"
                            value={formatSyncedAt(details.syncedAt || null)}
                        />
                    </dl>

                    {error ? (
                        <p className="text-destructive text-sm" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant={hasPreviousConsult ? "outline" : "default"}
                            disabled={loading}
                            onClick={() => void refreshDetails()}
                        >
                            {loading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <RefreshCw className="size-4" />
                            )}
                            {hasPreviousConsult
                                ? "Renovar consulta"
                                : "Consultar equipamento"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
