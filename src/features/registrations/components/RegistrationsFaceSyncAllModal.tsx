"use client";

import {
    CheckCircle2,
    Loader2,
    RefreshCw,
    TriangleAlert,
    XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { getClientFaceSyncProgressSseUrlAction } from "@/app/client/usuarios/actions";
import { getCompanyFaceSyncProgressSseUrlAction } from "@/app/company/clientes/[clientId]/usuarios/actions";
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
import { Button } from "@/components/ui/button";
import { humanizeDeviceSyncError } from "@/lib/face-sync-result";
import { useGlobalFaceSync } from "@/lib/use-global-face-sync";
import { cn } from "@/lib/utils";

type RegistrationsFaceSyncAllModalProps = {
    variant: "client" | "company";
    companyClientId?: string;
};

function progressPercent(processed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((processed / total) * 100));
}

export function RegistrationsFaceSyncAllModal({
    variant,
    companyClientId,
}: RegistrationsFaceSyncAllModalProps) {
    const router = useRouter();
    const { phase, progress, items, errorMessage, start, reset, cancel } =
        useGlobalFaceSync();
    const [open, setOpen] = useState(false);

    const isActive = phase === "connecting" || phase === "running";
    const failedItems = items.filter((item) => !item.ok);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                if (isActive) cancel();
                else reset();
                if (phase === "done") router.refresh();
            }
            setOpen(nextOpen);
        },
        [cancel, isActive, phase, reset, router],
    );

    const handleStart = useCallback(async () => {
        const urlResult =
            variant === "client"
                ? await getClientFaceSyncProgressSseUrlAction()
                : await getCompanyFaceSyncProgressSseUrlAction(
                      companyClientId ?? "",
                  );

        if ("error" in urlResult) {
            toast.error(urlResult.error);
            return;
        }

        start(urlResult.url);
    }, [companyClientId, start, variant]);

    const handleClose = useCallback(() => {
        if (isActive) cancel();
        else reset();
        setOpen(false);
        if (phase === "done") router.refresh();
    }, [cancel, isActive, phase, reset, router]);

    const pct = progressPercent(progress.processed, progress.total);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="default"
                className="gap-2 shrink-0"
                disabled={isActive}
                onClick={() => {
                    reset();
                    setOpen(true);
                    void handleStart();
                }}
            >
                {isActive ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <RefreshCw className="size-4" />
                )}
                Sincronizar todos no leitor
            </Button>

            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent className="max-w-md sm:max-w-md">
                    {phase === "connecting" || phase === "running" ? (
                        <AlertDialogHeader className="place-items-start text-left">
                            <AlertDialogMedia className="bg-muted mb-0">
                                <Loader2 className="size-6 animate-spin" />
                            </AlertDialogMedia>
                            <AlertDialogTitle>
                                Sincronizar faces nos leitores
                            </AlertDialogTitle>
                            <div className="w-full space-y-4 text-left">
                                <p className="text-muted-foreground text-sm">
                                    Envia cada cadastro aprovado pendente para
                                    todos os leitores ativos deste cliente.
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
                                    Sync em lote finalizado.
                                </AlertDialogDescription>
                                <div className="space-y-2 text-left text-sm">
                                    <p>
                                        {progress.synced} cadastro(s)
                                        sincronizado(s) com sucesso
                                        {progress.failed > 0
                                            ? ` · ${progress.failed} com falha`
                                            : ""}
                                        .
                                    </p>
                                    {progress.total === 0 ? (
                                        <p className="text-muted-foreground">
                                            Nenhum cadastro pendente de
                                            sincronização.
                                        </p>
                                    ) : null}
                                    {failedItems.length > 0 ? (
                                        <FailedItemsList items={failedItems} />
                                    ) : null}
                                </div>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
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
                                    Erro durante o sync em lote.
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
                                <AlertDialogAction onClick={handleClose}>
                                    Fechar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    ) : null}
                </AlertDialogContent>
            </AlertDialog>
        </>
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
