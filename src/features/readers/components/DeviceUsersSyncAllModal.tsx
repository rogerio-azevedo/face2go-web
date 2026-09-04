"use client";

import {
    CheckCircle2,
    Loader2,
    TriangleAlert,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { getDeviceUsersSyncAllSseUrlAction } from "@/app/company/leitores/actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { humanizeDeviceSyncError } from "@/lib/face-sync-result";
import { useGlobalFaceSync } from "@/lib/use-global-face-sync";
import { cn } from "@/lib/utils";

function progressPercent(processed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((processed / total) * 100));
}

export function DeviceUsersSyncAllModal({
    readerId,
    open,
    onOpenChange,
    onFinished,
}: {
    readerId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFinished: () => void;
}) {
    const { phase, progress, items, errorMessage, start, reset, cancel } =
        useGlobalFaceSync();
    const isActive = phase === "connecting" || phase === "running";
    const failedItems = items.filter((item) => !item.ok);
    const pct = progressPercent(progress.processed, progress.total);

    const begin = useCallback(async () => {
        const urlResult = await getDeviceUsersSyncAllSseUrlAction(readerId);
        if ("error" in urlResult) {
            toast.error(urlResult.error);
            onOpenChange(false);
            return;
        }
        start(urlResult.url);
    }, [onOpenChange, readerId, start]);

    useEffect(() => {
        if (!open) return;
        reset();
        void begin();
        return () => {
            cancel();
        };
        // start/reset/cancel são estáveis; só recomeça ao reabrir.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- abrir o modal dispara o SSE
    }, [open, readerId]);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                if (isActive) cancel();
                else reset();
                if (phase === "done") onFinished();
            }
            onOpenChange(nextOpen);
        },
        [cancel, isActive, onFinished, onOpenChange, phase, reset],
    );

    const handleClose = useCallback(() => {
        if (isActive) cancel();
        else reset();
        onOpenChange(false);
        if (phase === "done") onFinished();
    }, [cancel, isActive, onFinished, onOpenChange, phase, reset]);

    const handleRetryPending = useCallback(() => {
        reset();
        void begin();
    }, [begin, reset]);

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-md sm:max-w-md">
                {phase === "connecting" || phase === "running" || phase === "idle" ? (
                    <AlertDialogHeader className="place-items-start text-left">
                        <AlertDialogMedia className="bg-muted mb-0">
                            <Loader2 className="size-6 animate-spin" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            Sincronizar neste leitor
                        </AlertDialogTitle>
                        <div className="w-full space-y-4 text-left">
                            <p className="text-muted-foreground text-sm">
                                Envia só quem ainda não está synced neste
                                equipamento (pendentes e falhas). Quem já deu
                                certo é pulado.
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>
                                        {progress.processed} de{" "}
                                        {progress.total || "…"} concluídos
                                    </span>
                                    <span className="text-muted-foreground">
                                        {pct}%
                                    </span>
                                </div>
                                <div className="bg-muted h-2 overflow-hidden rounded-full">
                                    <div
                                        className="bg-primary h-full transition-all duration-300"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Sucesso: {progress.synced} · Falhas:{" "}
                                {progress.failed}
                            </p>
                            {failedItems.length > 0 ? (
                                <FailedItemsList items={failedItems} />
                            ) : null}
                        </div>
                    </AlertDialogHeader>
                ) : null}

                {phase === "done" ? (
                    <>
                        <AlertDialogHeader className="place-items-start text-left">
                            <AlertDialogMedia
                                className={cn(
                                    "mb-0",
                                    progress.failed > 0
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700",
                                )}
                            >
                                {progress.failed > 0 ? (
                                    <TriangleAlert className="size-6" />
                                ) : (
                                    <CheckCircle2 className="size-6" />
                                )}
                            </AlertDialogMedia>
                            <AlertDialogTitle>
                                {progress.failed > 0
                                    ? "Sincronização concluída com falhas"
                                    : "Sincronização concluída"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="sr-only">
                                Sync neste leitor finalizado.
                            </AlertDialogDescription>
                            <div className="space-y-2 text-left text-sm">
                                <p>
                                    {progress.synced} pessoa(s) enviada(s) com
                                    sucesso
                                    {progress.failed > 0
                                        ? ` · ${progress.failed} com falha`
                                        : ""}
                                    .
                                </p>
                                {progress.total === 0 ? (
                                    <p className="text-muted-foreground">
                                        Ninguém pendente neste leitor — todos
                                        com foto já sincronizaram, ou não há
                                        quem enviar.
                                    </p>
                                ) : null}
                                {failedItems.length > 0 ? (
                                    <FailedItemsList items={failedItems} />
                                ) : null}
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            {progress.failed > 0 ? (
                                <AlertDialogAction
                                    variant="outline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRetryPending();
                                    }}
                                >
                                    Tentar de novo as falhas
                                </AlertDialogAction>
                            ) : null}
                            <AlertDialogAction onClick={handleClose}>
                                Fechar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </>
                ) : null}

                {phase === "error" ? (
                    <>
                        <AlertDialogHeader className="place-items-start text-left">
                            <AlertDialogMedia
                                className={cn(
                                    "mb-0",
                                    progress.synced > 0
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-destructive/10 text-destructive",
                                )}
                            >
                                {progress.synced > 0 ? (
                                    <TriangleAlert className="size-6" />
                                ) : (
                                    <XCircle className="size-6" />
                                )}
                            </AlertDialogMedia>
                            <AlertDialogTitle>
                                {progress.synced > 0
                                    ? "Sincronização interrompida"
                                    : "Falha na sincronização"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="sr-only">
                                Erro durante o sync neste leitor.
                            </AlertDialogDescription>
                            <div className="space-y-2 text-left text-sm">
                                <p className="text-muted-foreground">
                                    {errorMessage ??
                                        "Ocorreu um erro durante a sincronização."}
                                </p>
                                {progress.processed > 0 ? (
                                    <p>
                                        Processados antes da interrupção:{" "}
                                        {progress.processed} (
                                        {progress.synced} ok,{" "}
                                        {progress.failed} falha).
                                    </p>
                                ) : null}
                                {failedItems.length > 0 ? (
                                    <FailedItemsList items={failedItems} />
                                ) : null}
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            {progress.processed > 0 ? (
                                <AlertDialogAction
                                    variant="outline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRetryPending();
                                    }}
                                >
                                    Continuar / reenviar falhas
                                </AlertDialogAction>
                            ) : null}
                            <AlertDialogAction onClick={handleClose}>
                                Fechar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </>
                ) : null}
            </AlertDialogContent>
        </AlertDialog>
    );
}

function FailedItemsList({
    items,
}: {
    items: { label: string; ok: boolean; error?: string }[];
}) {
    return (
        <div className="bg-destructive/5 max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-destructive/20 p-2.5">
            <p className="text-destructive text-xs font-medium">
                Erros de sincronização
            </p>
            <ul className="space-y-1">
                {items.map((item, index) => (
                    <li
                        key={`${item.label}-${index}`}
                        className="text-destructive text-xs"
                    >
                        <span className="font-medium">{item.label}</span>
                        {item.error ? (
                            <span className="text-destructive/80">
                                {" "}
                                — {humanizeDeviceSyncError(item.error)}
                            </span>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}
