"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
    fetchCamerasMonitorStatusAction,
    toggleCameraActiveAction,
} from "@/app/company/cameras/actions";
import type {
    CameraListRow,
    CameraMonitorDeviceApiRow,
    ClientListRow,
} from "@/types/domain";
import { CameraForm } from "@/components/company/cameras/CameraForm";
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
    CAMERA_BRAND_LABELS,
    CAMERA_TYPE_LABELS,
    CAMERA_DIRECTION_LABELS,
    type CameraBrandSlug,
    type CameraDirectionSlug,
    type CameraTypeSlug,
} from "@/lib/validations/cameras";

function canShowDevicePlatesListing(row: CameraListRow): boolean {
    const brand =
        typeof row.brand === "string" ? row.brand.trim().toLowerCase() : "";
    return row.type === "lpr" && brand === "intelbras" && row.hasCredentials;
}

function StreamConnectionBadge({
    device,
    loading,
}: {
    device: CameraMonitorDeviceApiRow | undefined;
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
            "Monitoramento indisponível (sem suporte ou credenciais).";
        return (
            <Badge variant="secondary" className="font-normal" title={hint}>
                Stream N/D
            </Badge>
        );
    }
    if (device.connected) {
        return (
            <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-normal text-emerald-800 hover:bg-emerald-50"
            >
                Stream online
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="border-red-200 bg-red-50 font-normal text-red-800 hover:bg-red-50"
            title={device.lastConnectionError ?? "Desconectado"}
        >
            Stream offline
        </Badge>
    );
}

function SnapBadge({
    device,
}: {
    device: CameraMonitorDeviceApiRow | undefined;
}) {
    if (!device?.streamSupported || !device.hasCredentials) {
        return (
            <span className="text-muted-foreground text-xs tabular-nums">—</span>
        );
    }
    if (device.connected) {
        return (
            <span className="text-xs tabular-nums text-emerald-700">Snap ok</span>
        );
    }
    return (
        <span
            className="cursor-help text-xs tabular-nums text-amber-700"
            title={device.lastConnectionError ?? "Snap indisponível"}
        >
            Snap off
        </span>
    );
}

export function CamerasTable({
    cameras,
    clients,
    canManage,
}: {
    cameras: CameraListRow[];
    clients: ClientListRow[];
    canManage: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editCamera, setEditCamera] = useState<CameraListRow | null>(null);
    const [filterClientId, setFilterClientId] = useState<string>("");
    const [monitorByCameraId, setMonitorByCameraId] = useState<
        Record<string, CameraMonitorDeviceApiRow>
    >({});
    const [monitorLoading, setMonitorLoading] = useState(true);

    const refreshMonitor = useCallback(
        async (opts?: { silent?: boolean }) => {
            if (!opts?.silent) {
                setMonitorLoading(true);
            }
            const result = await fetchCamerasMonitorStatusAction(
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
            const next: Record<string, CameraMonitorDeviceApiRow> = {};
            for (const d of result.data.devices) {
                next[d.cameraId] = d;
            }
            setMonitorByCameraId(next);
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

    const filtered = useMemo(() => {
        if (!filterClientId) return cameras;
        return cameras.filter((c) => c.clientId === filterClientId);
    }, [cameras, filterClientId]);

    function openCreate() {
        setEditCamera(null);
        setSheetOpen(true);
    }

    function openEdit(row: CameraListRow) {
        setEditCamera(row);
        setSheetOpen(true);
    }

    function toggleActive(cameraId: string, isActive: boolean) {
        startTransition(async () => {
            const result = await toggleCameraActiveAction({
                cameraId,
                isActive,
            });
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(isActive ? "Câmera reativada." : "Câmera desativada.");
            router.refresh();
        });
    }

    const colSpan = canManage ? 11 : 10;

    return (
        <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-xs">
                    <label
                        htmlFor="filter-camera-client"
                        className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                    >
                        Cliente
                    </label>
                    <select
                        id="filter-camera-client"
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
                        title="Atualizar status de monitoramento"
                    >
                        <RefreshCw
                            className={`size-3.5 ${monitorLoading ? "animate-spin" : ""}`}
                        />
                        Monitor
                    </Button>
                    {canManage ? (
                        <Button
                            type="button"
                            size="sm"
                            className="shrink-0"
                            onClick={openCreate}
                        >
                            Nova câmera
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
                            <TableHead>Tipo</TableHead>
                            <TableHead>Sentido</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Stream</TableHead>
                            <TableHead>Snap</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Listagem</TableHead>
                            {canManage ? (
                                <TableHead className="text-right">
                                    Ações
                                </TableHead>
                            ) : null}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    {cameras.length === 0
                                        ? "Nenhuma câmera cadastrada."
                                        : "Nenhuma câmera para o filtro selecionado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.clientName}
                                    </TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {CAMERA_TYPE_LABELS[
                                                row.type as CameraTypeSlug
                                            ] ?? row.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {row.type === "lpr" && row.direction ? (
                                            <Badge variant="outline">
                                                {
                                                    CAMERA_DIRECTION_LABELS[
                                                        row.direction as CameraDirectionSlug
                                                    ]
                                                }
                                            </Badge>
                                        ) : (
                                            <span
                                                className="text-muted-foreground text-sm"
                                                title={
                                                    row.type === "lpr"
                                                        ? "Defina no formulário de edição"
                                                        : undefined
                                                }
                                            >
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {CAMERA_BRAND_LABELS[
                                                row.brand as CameraBrandSlug
                                            ] ?? row.brand}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {row.ip}:{row.port}
                                    </TableCell>
                                    <TableCell>
                                        <StreamConnectionBadge
                                            device={
                                                monitorByCameraId[row.id]
                                            }
                                            loading={monitorLoading}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <SnapBadge
                                            device={
                                                monitorByCameraId[row.id]
                                            }
                                        />
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
                                                <Badge>Ativa</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Inativa
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {canShowDevicePlatesListing(row) ? (
                                            <Link
                                                href={`/company/cameras/${row.id}/device-plates`}
                                                className={buttonVariants({
                                                    variant: "outline",
                                                    size: "sm",
                                                })}
                                                title={
                                                    row.isActive
                                                        ? undefined
                                                        : "A câmera está inativa; a lista pode ficar indisponível até reativá-la."
                                                }
                                            >
                                                Placas
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                    {canManage ? (
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={pending}
                                                onClick={() =>
                                                    openEdit(row)
                                                }
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
                <CameraForm
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    mode={editCamera ? "edit" : "create"}
                    camera={editCamera}
                    clients={clients}
                />
            ) : null}
        </>
    );
}
