"use client";

import { CheckCircle2, Loader2, RefreshCw, TriangleAlert, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
    getResponsiblesGlobalFaceSyncSseUrlAction,
    getStudentsGlobalFaceSyncSseUrlAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
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
import { cn } from "@/lib/utils";
import { useGlobalFaceSync } from "@/lib/use-global-face-sync";

type FaceGlobalSyncModalProps = {
    clientId: string;
    kind: "students" | "responsibles";
    disabled?: boolean;
};

const LABELS = {
    students: {
        button: "Sincronizar todos os alunos",
        title: "Sync global de alunos",
        description:
            "Envia em lote as faces de alunos pendentes ou com falha para todos os leitores Intelbras ativos.",
        entity: "alunos",
    },
    responsibles: {
        button: "Sincronizar todos os responsáveis",
        title: "Sync global de responsáveis",
        description:
            "Envia em lote as faces de responsáveis pendentes ou com falha para todos os leitores Intelbras ativos.",
        entity: "responsáveis",
    },
} as const;

function progressPercent(processed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((processed / total) * 100));
}

export function FaceGlobalSyncModal({
    clientId,
    kind,
    disabled = false,
}: FaceGlobalSyncModalProps) {
    const router = useRouter();
    const labels = LABELS[kind];
    const { phase, progress, errorMessage, start, reset, cancel } =
        useGlobalFaceSync();
    const [open, setOpen] = useState(false);

    const isActive = phase === "connecting" || phase === "running";

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
            kind === "students"
                ? await getStudentsGlobalFaceSyncSseUrlAction(clientId)
                : await getResponsiblesGlobalFaceSyncSseUrlAction(clientId);

        if ("error" in urlResult) {
            toast.error(urlResult.error);
            return;
        }

        start(urlResult.url);
    }, [clientId, kind, start]);

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
                disabled={disabled || isActive}
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
                {labels.button}
            </Button>

            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogContent className="max-w-md sm:max-w-md">
                    {phase === "connecting" || phase === "running" ? (
                        <AlertDialogHeader className="place-items-start text-left">
                            <AlertDialogMedia className="bg-muted mb-0">
                                <Loader2 className="size-6 animate-spin" />
                            </AlertDialogMedia>
                            <AlertDialogTitle>{labels.title}</AlertDialogTitle>
                            <div className="w-full space-y-4 text-left">
                                <p className="text-muted-foreground text-sm">
                                    {labels.description}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>
                                            {progress.processed} de{" "}
                                            {progress.total || "…"}{" "}
                                            concluídos
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
                            </div>
                        </AlertDialogHeader>
                    ) : null}

                    {phase === "done" ? (
                        <>
                            <AlertDialogHeader className="place-items-start text-left">
                                <AlertDialogMedia className="mb-0 bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 className="size-6" />
                                </AlertDialogMedia>
                                <AlertDialogTitle>
                                    Sincronização concluída
                                </AlertDialogTitle>
                                <AlertDialogDescription className="sr-only">
                                    Sync global finalizado.
                                </AlertDialogDescription>
                                <div className="space-y-2 text-left text-sm">
                                    <p>
                                        {progress.synced} {labels.entity}{" "}
                                        sincronizados com sucesso
                                        {progress.failed > 0
                                            ? ` · ${progress.failed} com falha`
                                            : ""}
                                        .
                                    </p>
                                    {progress.total === 0 ? (
                                        <p className="text-muted-foreground">
                                            Nenhum {labels.entity.slice(0, -1)}{" "}
                                            pendente de sincronização.
                                        </p>
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
                                    Erro durante o sync global.
                                </AlertDialogDescription>
                                <div className="space-y-2 text-left text-sm">
                                    <p className="text-muted-foreground">
                                        {errorMessage ??
                                            "Ocorreu um erro durante o sync global."}
                                    </p>
                                    {progress.processed > 0 ? (
                                        <p>
                                            Processados antes da interrupção:{" "}
                                            {progress.processed} (
                                            {progress.synced} ok,{" "}
                                            {progress.failed} falha).
                                        </p>
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
