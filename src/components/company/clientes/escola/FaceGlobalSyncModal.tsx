"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { enqueueSchoolFaceSyncAction } from "@/features/school/actions/face-sync";
import { useSchoolFaceSync } from "@/features/school/hooks/use-school-face-sync";
import { Button } from "@/components/ui/button";

type FaceGlobalSyncModalProps = {
    clientId: string;
    kind: "students" | "responsibles";
    disabled?: boolean;
};

const LABELS = {
    students: {
        button: "Sincronizar todos os alunos",
        queued: "Sync de alunos enfileirado. Pode sair desta tela.",
        running: "Sincronizando alunos",
    },
    responsibles: {
        button: "Sincronizar todos os responsáveis",
        queued: "Sync de responsáveis enfileirado. Pode sair desta tela.",
        running: "Sincronizando responsáveis",
    },
} as const;

function bannerText(
    job: {
        kind: string;
        entityKind?: string;
        processed: number;
        total: number;
    },
    kind: "students" | "responsibles",
): string {
    const total = job.total > 0 ? job.total : "…";
    if (job.kind === "face.reader") {
        return `Sync neste leitor — ${job.processed} de ${total}`;
    }
    if (job.kind === "face.person") {
        return "Sync de uma pessoa em andamento";
    }
    const label =
        job.entityKind === "responsible" || kind === "responsibles"
            ? LABELS.responsibles.running
            : LABELS.students.running;
    return `${label} — ${job.processed} de ${total}`;
}

export function FaceGlobalSyncModal({
    clientId,
    kind,
    disabled = false,
}: FaceGlobalSyncModalProps) {
    const router = useRouter();
    const labels = LABELS[kind];
    const handleFinished = useCallback(() => {
        toast.success("Sincronização concluída em segundo plano.");
        router.refresh();
    }, [router]);
    const { syncBusy, activeJob, refetch } = useSchoolFaceSync(
        clientId,
        handleFinished,
    );

    const handleStart = useCallback(async () => {
        const res = await enqueueSchoolFaceSyncAction(clientId, kind);
        if (!res.ok) {
            toast.error(res.error);
            return;
        }
        await refetch();
        toast.success(labels.queued);
    }, [clientId, kind, labels.queued, refetch]);

    return (
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
                type="button"
                variant="outline"
                size="default"
                className="gap-2 shrink-0"
                disabled={disabled || syncBusy}
                onClick={() => void handleStart()}
            >
                {syncBusy ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <RefreshCw className="size-4" />
                )}
                {labels.button}
            </Button>
            {activeJob ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    {bannerText(activeJob, kind)}
                    <span>· pode sair desta tela</span>
                </p>
            ) : null}
        </div>
    );
}
