"use client";

import { CheckCircle2, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

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
import { deferInEffect } from "@/lib/defer-in-effect";
import { cn } from "@/lib/utils";
import {
    FACE_SYNC_STEPS,
    humanizeDeviceSyncError,
    parseFaceSyncOutcome,
} from "@/lib/face-sync-result";

export type FaceSyncModalState =
    | { phase: "idle" }
    | { phase: "syncing"; name: string }
    | {
          phase: "done";
          name: string;
          status: string;
          error: string | null;
      };

type FaceSyncResultModalProps = {
    state: FaceSyncModalState;
    onClose: () => void;
};

export function FaceSyncResultModal({
    state,
    onClose,
}: FaceSyncResultModalProps) {
    const open = state.phase !== "idle";
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        let id: number | undefined;

        deferInEffect(() => {
            if (state.phase !== "syncing") {
                setActiveStep(0);
                return;
            }

            setActiveStep(0);
            id = window.setInterval(() => {
                setActiveStep((prev) =>
                    prev >= FACE_SYNC_STEPS.length - 1 ? prev : prev + 1,
                );
            }, 1400);
        });

        return () => {
            if (id !== undefined) window.clearInterval(id);
        };
    }, [state.phase, state.phase === "syncing" ? state.name : null]);

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && state.phase === "done") {
            onClose();
        }
    }

    const outcome =
        state.phase === "done"
            ? parseFaceSyncOutcome(state.status, state.error)
            : null;

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-md sm:max-w-md">
                {state.phase === "syncing" ? (
                    <>
                        <AlertDialogHeader className="place-items-start text-left">
                            <AlertDialogMedia className="bg-muted mb-0">
                                <Loader2 className="size-6 animate-spin" />
                            </AlertDialogMedia>
                            <AlertDialogTitle>
                                Sincronizando {state.name}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="sr-only">
                                Sincronização facial em andamento.
                            </AlertDialogDescription>
                            <div className="w-full space-y-3 text-left">
                                <p className="text-muted-foreground text-sm">
                                    Enviando dados para os leitores faciais.
                                    Aguarde…
                                </p>
                                <ol className="space-y-2 text-sm">
                                    {FACE_SYNC_STEPS.map((step, index) => {
                                        const done = index < activeStep;
                                        const current = index === activeStep;
                                        return (
                                            <li
                                                key={step}
                                                className={cn(
                                                    "flex items-center gap-2",
                                                    done && "text-muted-foreground",
                                                    current &&
                                                        "text-foreground font-medium",
                                                    !done &&
                                                        !current &&
                                                        "text-muted-foreground/60",
                                                )}
                                            >
                                                {done ? (
                                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                                ) : current ? (
                                                    <Loader2 className="size-4 shrink-0 animate-spin" />
                                                ) : (
                                                    <span className="bg-muted size-4 shrink-0 rounded-full" />
                                                )}
                                                {step}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        </AlertDialogHeader>
                    </>
                ) : state.phase === "done" ? (
                    <>
                        <AlertDialogHeader className="place-items-start text-left">
                            <AlertDialogMedia
                                className={cn(
                                    "mb-0",
                                    outcome === "success" &&
                                        "bg-emerald-100 text-emerald-700",
                                    outcome === "partial" &&
                                        "bg-amber-100 text-amber-700",
                                    outcome === "failed" &&
                                        "bg-destructive/10 text-destructive",
                                )}
                            >
                                {outcome === "success" ? (
                                    <CheckCircle2 className="size-6" />
                                ) : outcome === "partial" ? (
                                    <TriangleAlert className="size-6" />
                                ) : (
                                    <XCircle className="size-6" />
                                )}
                            </AlertDialogMedia>
                            <AlertDialogTitle>
                                {outcome === "success"
                                    ? "Sincronização concluída"
                                    : outcome === "partial"
                                      ? "Sincronização parcial"
                                      : "Falha na sincronização"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="sr-only">
                                Resultado da sincronização facial.
                            </AlertDialogDescription>
                            <div className="w-full space-y-2 text-left">
                                <p className="text-foreground text-sm font-medium">
                                    {state.name}
                                </p>
                                {outcome === "success" ? (
                                    <p className="text-muted-foreground text-sm">
                                        Face sincronizada com sucesso em todos
                                        os leitores.
                                    </p>
                                ) : null}
                                {outcome === "partial" ? (
                                    <>
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            {state.error}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Um ou mais leitores estão offline ou
                                            inacessíveis no momento. A face foi
                                            enviada aos leitores disponíveis.
                                        </p>
                                    </>
                                ) : null}
                                {outcome === "failed" ? (
                                    <p className="text-muted-foreground text-sm">
                                        {humanizeDeviceSyncError(state.error)}
                                    </p>
                                ) : null}
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={onClose}>
                                Fechar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </>
                ) : null}
            </AlertDialogContent>
        </AlertDialog>
    );
}
