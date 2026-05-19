"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import {
    fetchReadersMonitorStatusAction,
    toggleReaderActiveAction,
} from "@/app/company/leitores/actions";
import type {
    ClientListRow,
    ReaderListRow,
    ReaderMonitorDeviceApiRow,
} from "@/types/domain";
import { ReaderForm } from "@/components/company/leitores/ReaderForm";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    READER_BRAND_LABELS,
    READER_DIRECTION_LABELS,
    type ReaderBrandSlug,
    type ReaderDirectionSlug,
} from "@/lib/validations/readers";

function ConnectionBadge({
    device,
    loading,
}: {
    device: ReaderMonitorDeviceApiRow | undefined;
    loading: boolean;
}) {
    if (loading && !device) {
        return (
            <span className="text-muted-foreground text-sm tabular-nums">
                …
            </span>
        );
    }
    if (!device) {
        return (
            <span className="text-muted-foreground text-sm" title="Sem dados">
                —
            </span>
        );
    }
    if (!device.streamSupported) {
        const hint =
            device.lastConnectionError ??
            "Monitoramento de stream indisponível.";
        return (
            <Badge
                variant="secondary"
                className="font-normal"
                title={hint}
            >
                N/D
            </Badge>
        );
    }
    if (device.connected) {
        return (
            <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-normal text-emerald-800 hover:bg-emerald-50"
            >
                Online
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="border-red-200 bg-red-50 font-normal text-red-800 hover:bg-red-50"
            title={device.lastConnectionError ?? "Desconectado"}
        >
            Offline
        </Badge>
    );
}

export function ReadersTable({
    readers,
    clients,
    canManage,
}: {
    readers: ReaderListRow[];
    clients: ClientListRow[];
    canManage: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
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
        void refreshMonitor();
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

    function toggleActive(readerId: string, isActive: boolean) {
        startTransition(async () => {
            const result = await toggleReaderActiveAction({
                readerId,
                isActive,
            });
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(
                isActive ? "Leitor reativado." : "Leitor desativado.",
            );
            router.refresh();
        });
    }

    const colSpan = canManage ? 8 : 7;

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

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Conexão</TableHead>
                            <TableHead>Direção</TableHead>
                            <TableHead>Status</TableHead>
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
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.clientName}
                                    </TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {READER_BRAND_LABELS[
                                                row.brand as ReaderBrandSlug
                                            ] ?? row.brand}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {row.ip}:{row.port}
                                    </TableCell>
                                    <TableCell>
                                        <ConnectionBadge
                                            device={monitorByReaderId[row.id]}
                                            loading={monitorLoading}
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
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {canManage ? (
                                                <Switch
                                                    checked={row.isActive}
                                                    disabled={pending}
                                                    onCheckedChange={(v) =>
                                                        toggleActive(
                                                            row.id,
                                                            v === true,
                                                        )
                                                    }
                                                />
                                            ) : null}
                                            {row.isActive ? (
                                                <Badge>Ativo</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Inativo
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    {canManage ? (
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {row.brand === "intelbras" ? (
                                                    <Link
                                                        href={`/company/leitores/${row.id}/device-users`}
                                                        className={buttonVariants({ variant: "outline", size: "sm" })}
                                                    >
                                                        Usuários
                                                    </Link>
                                                ) : null}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={pending}
                                                    onClick={() => openEdit(row)}
                                                >
                                                    Editar
                                                </Button>
                                            </div>
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
