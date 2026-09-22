"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { fetchClientReadersMonitorStatusAction } from "@/features/readers/actions/monitor";
import { ConnectionBadge } from "@/features/readers/components/ConnectionBadge";
import { ReaderOpenDoorButton } from "@/features/readers/components/ReaderOpenDoorButton";
import { deferInEffect } from "@/lib/defer-in-effect";
import {
    READER_DIRECTION_LABELS,
    type ReaderDirectionSlug,
} from "@/lib/validations/readers";
import type {
    ClientReaderListRow,
    ReaderMonitorDeviceApiRow,
} from "@/types/domain";

export function ClientReadersTable({
    readers,
}: {
    readers: ClientReaderListRow[];
}) {
    const [monitorByReaderId, setMonitorByReaderId] = useState<
        Record<string, ReaderMonitorDeviceApiRow>
    >({});
    const [monitorLoading, setMonitorLoading] = useState(true);

    const refreshMonitor = useCallback(async (opts?: { silent?: boolean }) => {
        if (!opts?.silent) {
            setMonitorLoading(true);
        }
        const result = await fetchClientReadersMonitorStatusAction();
        if (!result.ok) {
            if (!opts?.silent) {
                toast.error(result.error);
                setMonitorLoading(false);
            }
            return;
        }
        const next: Record<string, ReaderMonitorDeviceApiRow> = {};
        for (const device of result.data.devices) {
            next[device.readerId] = device;
        }
        setMonitorByReaderId(next);
        if (!opts?.silent) {
            setMonitorLoading(false);
        }
    }, []);

    useEffect(() => {
        deferInEffect(() => {
            void refreshMonitor();
        });
        const id = window.setInterval(
            () => void refreshMonitor({ silent: true }),
            10_000,
        );
        return () => window.clearInterval(id);
    }, [refreshMonitor]);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Direção</TableHead>
                        <TableHead title="Monitor de eventos (stream/poll) — não indica se o ISAPI responde">
                            Conexão
                        </TableHead>
                        <TableHead>Abrir</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {readers.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-muted-foreground py-10 text-center"
                            >
                                Nenhum leitor cadastrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        readers.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">
                                    {row.name}
                                </TableCell>
                                <TableCell>
                                    {row.direction ? (
                                        <Badge variant="outline">
                                            {
                                                READER_DIRECTION_LABELS[
                                                    row.direction as ReaderDirectionSlug
                                                ]
                                            }
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <ConnectionBadge
                                        device={monitorByReaderId[row.id]}
                                        loading={monitorLoading}
                                    />
                                </TableCell>
                                <TableCell>
                                    <ReaderOpenDoorButton
                                        readerId={row.id}
                                        readerName={row.name}
                                        disabled={!row.isActive}
                                        variant="client"
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
