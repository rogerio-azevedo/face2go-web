"use client";

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { fetchReadersMonitorStatusAction } from "@/app/company/leitores/actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import type {
    ClientListRow,
    ReaderListRow,
    ReaderMonitorDeviceApiRow,
} from "@/types/domain";
import { ReaderForm } from "@/components/company/leitores/ReaderForm";
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
import { ConnectionBadge } from "@/features/readers/components/ConnectionBadge";
import { CompanyReadersMobileList } from "@/features/readers/components/CompanyReadersMobileList";
import { ReaderDetailsDialog } from "@/features/readers/components/ReaderDetailsDialog";
import { ReaderHoldOpenSwitch } from "@/features/readers/components/ReaderHoldOpenSwitch";
import { ReaderOpenDoorButton } from "@/features/readers/components/ReaderOpenDoorButton";
import { cn } from "@/lib/utils";
import {
    READER_BRAND_LABELS,
    READER_DIRECTION_LABELS,
    type ReaderBrandSlug,
    type ReaderDirectionSlug,
} from "@/lib/validations/readers";

export function ReadersTable({
    readers,
    clients,
    canManage,
}: {
    readers: ReaderListRow[];
    clients: ClientListRow[];
    canManage: boolean;
}) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editReader, setEditReader] = useState<ReaderListRow | null>(null);
    const [filterClientId, setFilterClientId] = useState<string>("");
    const [monitorByReaderId, setMonitorByReaderId] = useState<
        Record<string, ReaderMonitorDeviceApiRow>
    >({});
    const [monitorLoading, setMonitorLoading] = useState(true);

    const refreshMonitor = useCallback(
        async (opts?: { silent?: boolean }) => {
            if (!opts?.silent) {
                setMonitorLoading(true);
            }
            const result = await fetchReadersMonitorStatusAction(
                filterClientId || undefined,
            );
            if (!result.ok) {
                if (!opts?.silent) {
                    toast.error(result.error);
                }
                if (!opts?.silent) {
                    setMonitorLoading(false);
                }
                return;
            }
            const next: Record<string, ReaderMonitorDeviceApiRow> = {};
            for (const d of result.data.devices) {
                next[d.readerId] = d;
            }
            setMonitorByReaderId(next);
            if (!opts?.silent) {
                setMonitorLoading(false);
            }
        },
        [filterClientId],
    );

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

    const filteredReaders = useMemo(() => {
        if (!filterClientId) return readers;
        return readers.filter((r) => r.clientId === filterClientId);
    }, [readers, filterClientId]);

    function openCreate() {
        setEditReader(null);
        setSheetOpen(true);
    }

    function openEdit(row: ReaderListRow) {
        setEditReader(row);
        setSheetOpen(true);
    }

    const colSpan = canManage ? 9 : 6;

    return (
        <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                    <label
                        htmlFor="filter-client"
                        className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                    >
                        Cliente
                    </label>
                    <select
                        id="filter-client"
                        className="border-input bg-card text-foreground h-10 w-full rounded-md border px-3 text-sm shadow-sm"
                        value={filterClientId}
                        onChange={(e) => setFilterClientId(e.target.value)}
                    >
                        <option value="">Todos</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-wrap items-end gap-2 self-end sm:self-auto">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        disabled={monitorLoading}
                        onClick={() => void refreshMonitor()}
                        title="Atualizar status de conexão"
                    >
                        <RefreshCw
                            className={`size-3.5 ${monitorLoading ? "animate-spin" : ""}`}
                        />
                        Conexão
                    </Button>
                    {canManage ? (
                        <Button
                            type="button"
                            size="sm"
                            className="shrink-0"
                            onClick={openCreate}
                        >
                            Novo leitor
                        </Button>
                    ) : null}
                </div>
            </div>

            <CompanyReadersMobileList
                readers={filteredReaders}
                hasUnfilteredReaders={readers.length > 0}
                canManage={canManage}
                monitorLoading={monitorLoading}
                monitorByReaderId={monitorByReaderId}
                onOpenEdit={openEdit}
            />

            <div className="hidden rounded-md border md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Detalhes</TableHead>
                            <TableHead title="No modo direto, monitor de eventos. No registro automático (sem NAT), sessão do gateway.">
                                Conexão
                            </TableHead>
                            <TableHead>Direção</TableHead>
                            {canManage ? (
                                <TableHead>Abrir</TableHead>
                            ) : null}
                            {canManage ? (
                                <TableHead className="text-center">
                                    Usuários
                                </TableHead>
                            ) : null}
                            {canManage ? (
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            ) : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReaders.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    {readers.length === 0
                                        ? "Nenhum leitor cadastrado."
                                        : "Nenhum leitor para o filtro selecionado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReaders.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={cn(
                                        !row.isActive && "text-destructive",
                                    )}
                                    title={
                                        !row.isActive
                                            ? "Leitor inativo"
                                            : undefined
                                    }
                                >
                                    <TableCell className="font-medium">
                                        {row.clientName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span>{row.name}</span>
                                            {row.minimumAccessAge != null ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-orange-300 bg-orange-100 font-semibold text-orange-900 hover:bg-orange-100"
                                                    title={`Só sincroniza pessoas com data válida e ${row.minimumAccessAge} anos ou mais`}
                                                >
                                                    {row.minimumAccessAge}+
                                                </Badge>
                                            ) : null}
                                            {row.agePolicyStatus === "pending" ? (
                                                <span
                                                    className="text-muted-foreground inline-flex items-center gap-1 text-xs"
                                                    title="Aplicando a política no equipamento"
                                                >
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                    Aplicando
                                                </span>
                                            ) : null}
                                            {row.agePolicyStatus === "failed" ? (
                                                <span
                                                    className="text-destructive inline-flex items-center gap-1 text-xs font-medium"
                                                    title={
                                                        row.agePolicyError ??
                                                        "Falha ao aplicar a política no equipamento"
                                                    }
                                                >
                                                    <AlertTriangle className="size-3.5" />
                                                    Falha
                                                </span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {READER_BRAND_LABELS[
                                                row.brand as ReaderBrandSlug
                                            ] ?? row.brand}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <ReaderDetailsDialog
                                            readerId={row.id}
                                            readerName={row.name}
                                            endpoint={`${row.ip}:${row.port}`}
                                            model={row.model}
                                            serialNumber={row.serialNumber}
                                            firmwareVersion={row.firmwareVersion}
                                            syncedAt={row.deviceInfoSyncedAt}
                                            lastError={row.deviceInfoLastError}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <ConnectionBadge
                                            device={monitorByReaderId[row.id]}
                                            loading={monitorLoading}
                                            connectionMode={row.connectionMode}
                                        />
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
                                            <span
                                                className="text-muted-foreground text-sm"
                                                title="Defina no formulário de edição"
                                            >
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    {canManage ? (
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <ReaderOpenDoorButton
                                                    readerId={row.id}
                                                    readerName={row.name}
                                                    disabled={!row.isActive}
                                                    variant="company"
                                                />
                                                <ReaderHoldOpenSwitch
                                                    readerId={row.id}
                                                    readerName={row.name}
                                                    heldOpen={
                                                        row.doorHoldOpen === true
                                                    }
                                                    heldOpenAt={
                                                        row.doorHoldOpenedAt
                                                    }
                                                    heldOpenByName={
                                                        row.doorHoldOpenedByName
                                                    }
                                                    disabled={!row.isActive}
                                                    variant="company"
                                                />
                                            </div>
                                        </TableCell>
                                    ) : null}
                                    {canManage ? (
                                        <TableCell className="text-center">
                                            {(row.brand === "intelbras" ||
                                                row.brand === "hikvision") ? (
                                                <Button
                                                    nativeButton={false}
                                                    render={
                                                        <Link
                                                            href={`/company/leitores/${row.id}/device-users`}
                                                        />
                                                    }
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Usuários
                                                </Button>
                                            ) : null}
                                        </TableCell>
                                    ) : null}
                                    {canManage ? (
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(row)}
                                            >
                                                Editar
                                            </Button>
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {canManage ? (
                <ReaderForm
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    mode={editReader ? "edit" : "create"}
                    reader={editReader}
                    clients={clients}
                />
            ) : null}
        </>
    );
}
