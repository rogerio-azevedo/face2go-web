"use client";

import { Ban, Loader2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    JOB_KIND_LABEL,
    JOB_STATUS_LABEL,
    JOB_STATUS_VARIANT,
    formatJobTime,
} from "@/features/device-sync/components/device-sync-labels";
import type { DeviceSyncJobItem } from "@/features/device-sync/types";

type DeviceSyncJobsTableProps = {
    items: DeviceSyncJobItem[];
    pendingJobId: string | null;
    onCancel: (job: DeviceSyncJobItem) => void;
    onRetry: (job: DeviceSyncJobItem) => void;
};

export function DeviceSyncJobsTable({
    items,
    pendingJobId,
    onCancel,
    onRetry,
}: DeviceSyncJobsTableProps) {
    if (items.length === 0) {
        return (
            <p className="text-muted-foreground rounded-lg border px-4 py-10 text-center text-sm">
                Nenhum job neste filtro.
            </p>
        );
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Alvo</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Tentativas</TableHead>
                        <TableHead>Criado</TableHead>
                        <TableHead>Terminado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((job) => {
                        const busy = pendingJobId === job.jobId;
                        const canCancel =
                            (job.status === "queued" ||
                                job.status === "running") &&
                            !job.cancelRequested;
                        const canRetry =
                            job.status === "failed" ||
                            job.status === "canceled";
                        return (
                            <TableRow key={job.jobId}>
                                <TableCell>
                                    <div className="flex flex-col items-start gap-1">
                                        <Badge
                                            variant={
                                                JOB_STATUS_VARIANT[job.status]
                                            }
                                        >
                                            {JOB_STATUS_LABEL[job.status]}
                                        </Badge>
                                        {job.cancelRequested &&
                                        job.status === "running" ? (
                                            <span className="text-muted-foreground text-xs">
                                                Cancelando…
                                            </span>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {JOB_KIND_LABEL[job.kind]}
                                    {job.force ? (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            · forçado
                                        </span>
                                    ) : null}
                                </TableCell>
                                <TableCell className="max-w-64">
                                    <p className="truncate text-sm font-medium">
                                        {job.label ?? "—"}
                                    </p>
                                    {job.error ? (
                                        <p
                                            className="text-destructive line-clamp-2 text-xs"
                                            title={job.error}
                                        >
                                            {job.error}
                                        </p>
                                    ) : null}
                                </TableCell>
                                <TableCell className="text-sm tabular-nums">
                                    {job.total > 0
                                        ? `${job.processed}/${job.total}`
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-sm tabular-nums">
                                    {job.attempts}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs tabular-nums">
                                    {formatJobTime(job.createdAt)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs tabular-nums">
                                    {formatJobTime(job.finishedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {busy ? (
                                        <Loader2 className="ml-auto size-4 animate-spin" />
                                    ) : canCancel ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => onCancel(job)}
                                        >
                                            <Ban className="size-3.5" />
                                            Cancelar
                                        </Button>
                                    ) : canRetry ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => onRetry(job)}
                                        >
                                            <RotateCcw className="size-3.5" />
                                            Reprocessar
                                        </Button>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
