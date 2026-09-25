"use client";

import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DeviceSyncJobsTable } from "@/features/device-sync/components/DeviceSyncJobsTable";
import { useDeviceSyncQueue } from "@/features/device-sync/hooks/use-device-sync-queue";
import type {
    DeviceSyncJobItem,
    DeviceSyncJobSummary,
    DeviceSyncStatusFilter,
} from "@/features/device-sync/types";
import { cn } from "@/lib/utils";

const FILTERS: Array<{
    value: DeviceSyncStatusFilter;
    label: string;
    count?: (s: DeviceSyncJobSummary) => number;
}> = [
    { value: "active", label: "Ativos", count: (s) => s.queued + s.running },
    { value: "failed", label: "Falhas", count: (s) => s.failed },
    { value: "canceled", label: "Cancelados", count: (s) => s.canceled },
    { value: "done", label: "Concluídos", count: (s) => s.done },
    { value: "all", label: "Todos" },
];

export function DeviceSyncQueuePanel({ clientId }: { clientId: string }) {
    const [status, setStatus] = useState<DeviceSyncStatusFilter>("active");
    const [page, setPage] = useState(1);
    const [confirmClear, setConfirmClear] = useState(false);
    const { summary, list, cancel, retry, cancelQueued } = useDeviceSyncQueue(
        clientId,
        { status, page },
    );

    const pendingJobId = cancel.isPending
        ? (cancel.variables ?? null)
        : retry.isPending
          ? (retry.variables ?? null)
          : null;

    const handleCancel = (job: DeviceSyncJobItem) => {
        cancel.mutate(job.jobId, {
            onSuccess: (data) =>
                toast.success(
                    data.result === "canceled"
                        ? "Job cancelado."
                        : "Cancelamento pedido — para no próximo item.",
                ),
            onError: (err) => toast.error(err.message),
        });
    };

    const handleRetry = (job: DeviceSyncJobItem) => {
        retry.mutate(job.jobId, {
            onSuccess: () => toast.success("Job reenfileirado."),
            onError: (err) => toast.error(err.message),
        });
    };

    const handleClear = () => {
        setConfirmClear(false);
        cancelQueued.mutate(undefined, {
            onSuccess: (data) =>
                toast.success(`${data.canceled} job(s) removido(s) da fila.`),
            onError: (err) => toast.error(err.message),
        });
    };

    const queued = summary.data?.queued ?? 0;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <Button
                            key={f.value}
                            type="button"
                            size="sm"
                            variant={status === f.value ? "default" : "outline"}
                            onClick={() => {
                                setStatus(f.value);
                                setPage(1);
                            }}
                        >
                            {f.label}
                            {f.count && summary.data ? (
                                <span
                                    className={cn(
                                        "ml-1 tabular-nums",
                                        status !== f.value &&
                                            "text-muted-foreground",
                                    )}
                                >
                                    {f.count(summary.data)}
                                </span>
                            ) : null}
                        </Button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        disabled={list.isFetching}
                        onClick={() => void list.refetch()}
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                list.isFetching && "animate-spin",
                            )}
                        />
                        Atualizar
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={queued === 0 || cancelQueued.isPending}
                        onClick={() => setConfirmClear(true)}
                    >
                        {cancelQueued.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="size-3.5" />
                        )}
                        Limpar fila
                    </Button>
                </div>
            </div>

            {list.isError ? (
                <p className="text-destructive text-sm">{list.error.message}</p>
            ) : list.data ? (
                <>
                    <DeviceSyncJobsTable
                        items={list.data.items}
                        pendingJobId={pendingJobId}
                        onCancel={handleCancel}
                        onRetry={handleRetry}
                    />
                    <DataTablePagination
                        page={list.data.page}
                        pageSize={list.data.pageSize}
                        total={list.data.total}
                        onPageChange={setPage}
                        disabled={list.isFetching}
                    />
                </>
            ) : (
                <div className="flex justify-center py-10">
                    <Loader2 className="text-muted-foreground size-5 animate-spin" />
                </div>
            )}

            <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Limpar a fila?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {queued} job(s) que ainda não começaram serão
                            cancelados. Jobs em execução continuam. Cadastros
                            afetados ficam como falha de sync e podem ser
                            reprocessados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClear}>
                            Limpar fila
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
