"use client";

import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import type {
    ClientListRow,
    LprAccessPhotoUrls,
    LprAccessesListResponse,
} from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    getApiBaseUrl,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

import { LprPhotoSheet } from "./LprPhotoSheet";

function confidenceBadge(confidence: number | null) {
    if (confidence == null || Number.isNaN(confidence)) {
        return (
            <Badge variant="secondary" className="font-normal tabular-nums">
                —
            </Badge>
        );
    }
    if (confidence >= 80) {
        return (
            <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-normal text-emerald-800 tabular-nums hover:bg-emerald-50"
            >
                {confidence}%
            </Badge>
        );
    }
    if (confidence >= 60) {
        return (
            <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 font-normal text-amber-900 tabular-nums hover:bg-amber-50"
            >
                {confidence}%
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="font-normal tabular-nums">
            {confidence}%
        </Badge>
    );
}

/** Exibe instante UTC no relógio civil com offset fixo (minutos desde UTC). */
function formatDateTime(iso: string | null, offsetMinutes: number): string {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "—";
        const shifted = new Date(d.getTime() + offsetMinutes * 60_000);
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "medium",
            timeZone: "UTC",
        }).format(shifted);
    } catch {
        return "—";
    }
}

type Props = {
    data: LprAccessesListResponse;
    clients: ClientListRow[];
    clientTimezoneOffsetMinutes: number;
    filters: {
        clientId: string;
        startDate: string;
        endDate: string;
    };
    /** Bearer JWT para `GET /api/lpr-accesses/:id/photo` no navegador. */
    accessToken: string;
};

export function LprAccessesTable({
    data,
    clients,
    clientTimezoneOffsetMinutes,
    filters,
    accessToken,
}: Props) {
    const router = useRouter();
    const params = useSearchParams();
    const [pending, startTransition] = useTransition();

    const [photoOpen, setPhotoOpen] = useState(false);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoUrls, setPhotoUrls] = useState<LprAccessPhotoUrls | null>(
        null,
    );
    const [photoSubtitle, setPhotoSubtitle] = useState("");

    const openLprPhotos = useCallback(
        async (accessId: string, plateLabel: string) => {
            if (!accessToken.trim()) {
                setPhotoSubtitle(plateLabel);
                setPhotoOpen(true);
                setPhotoLoading(false);
                setPhotoError("Sessão inválida. Faça login novamente.");
                setPhotoUrls(null);
                return;
            }
            setPhotoSubtitle(plateLabel);
            setPhotoOpen(true);
            setPhotoLoading(true);
            setPhotoError(null);
            setPhotoUrls(null);
            try {
                const url = `${getApiBaseUrl()}/api/lpr-accesses/${encodeURIComponent(accessId)}/photo`;
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const parsed = await parseResponseJson(res);
                if (!res.ok) {
                    setPhotoError(nestErrorMessage(parsed));
                    return;
                }
                const body = parsed as LprAccessPhotoUrls;
                setPhotoUrls({
                    cutoutUrl:
                        typeof body?.cutoutUrl === "string"
                            ? body.cutoutUrl
                            : null,
                    vehicleUrl:
                        typeof body?.vehicleUrl === "string"
                            ? body.vehicleUrl
                            : null,
                    normalUrl:
                        typeof body?.normalUrl === "string"
                            ? body.normalUrl
                            : null,
                });
            } catch {
                setPhotoError("Erro ao carregar fotos.");
            } finally {
                setPhotoLoading(false);
            }
        },
        [accessToken],
    );

    const totalPages = useMemo(
        () =>
            Math.max(1, Math.ceil(data.total / Math.max(1, data.pageSize))),
        [data.total, data.pageSize],
    );

    const buildHref = useCallback(
        (patch: Record<string, string | undefined>) => {
            const next = new URLSearchParams(params?.toString() ?? "");
            next.set("type", "lpr");
            for (const [k, v] of Object.entries(patch)) {
                if (v === undefined || v === "") next.delete(k);
                else next.set(k, v);
            }
            const q = next.toString();
            return q ? `/company/acessos?${q}` : "/company/acessos";
        },
        [params],
    );

    const applyFilters = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const clientId = String(fd.get("clientId") ?? "").trim();
        const startDate = String(fd.get("startDate") ?? "").trim();
        const endDate = String(fd.get("endDate") ?? "").trim();
        startTransition(() => {
            router.push(
                buildHref({
                    clientId: clientId || undefined,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    page: undefined,
                }),
            );
        });
    };

    const goPage = (p: number) => {
        startTransition(() => {
            router.push(
                buildHref({
                    page: p > 1 ? String(p) : undefined,
                }),
            );
        });
    };

    return (
        <div className="space-y-6">
            <LprPhotoSheet
                open={photoOpen}
                loading={photoLoading}
                error={photoError}
                urls={photoUrls}
                subtitle={photoSubtitle || undefined}
                onOpenChange={(next) => {
                    setPhotoOpen(next);
                    if (!next) {
                        setPhotoUrls(null);
                        setPhotoError(null);
                        setPhotoLoading(false);
                        setPhotoSubtitle("");
                    }
                }}
            />

            <form
                onSubmit={applyFilters}
                className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
            >
                <div className="grid flex-1 gap-2 min-w-[200px]">
                    <Label htmlFor="lpr-filter-client">Cliente</Label>
                    <select
                        id="lpr-filter-client"
                        name="clientId"
                        defaultValue={filters.clientId}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">Todos os clientes</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-2 min-w-[160px]">
                    <Label htmlFor="lpr-filter-start">De</Label>
                    <Input
                        id="lpr-filter-start"
                        name="startDate"
                        type="date"
                        defaultValue={filters.startDate}
                    />
                </div>
                <div className="grid gap-2 min-w-[160px]">
                    <Label htmlFor="lpr-filter-end">Até</Label>
                    <Input
                        id="lpr-filter-end"
                        name="endDate"
                        type="date"
                        defaultValue={filters.endDate}
                    />
                </div>
                <Button type="submit" disabled={pending}>
                    Filtrar
                </Button>
            </form>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>Placa</TableHead>
                            <TableHead>Câmera</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Horário</TableHead>
                            <TableHead className="text-right">
                                Confiança
                            </TableHead>
                            <TableHead>Direção</TableHead>
                            <TableHead className="text-center">
                                <span className="sr-only">Visualizar foto</span>
                                <Eye
                                    className="inline size-4 text-muted-foreground"
                                    aria-hidden
                                />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.items.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Nenhuma detecção de placa encontrada para
                                    os filtros atuais.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.items.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold tracking-wide">
                                                    {row.plateNumber}
                                                </span>
                                                {row.isBlocked === true ? (
                                                    <Badge
                                                        variant="destructive"
                                                        className="text-xs font-normal"
                                                    >
                                                        Bloqueado
                                                    </Badge>
                                                ) : null}
                                                {row.isAllowed === true ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-emerald-200 bg-emerald-50 text-xs font-normal text-emerald-800 hover:bg-emerald-50"
                                                    >
                                                        Permitido
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            {(row.plateColor ||
                                                row.vehicleType ||
                                                row.vehicleBrand) && (
                                                <span className="text-xs text-muted-foreground">
                                                    {[
                                                        row.plateColor,
                                                        row.vehicleBrand ??
                                                            undefined,
                                                        row.vehicleType,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ") || "—"}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.cameraName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.clientName}
                                    </TableCell>
                                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                                        {formatDateTime(
                                            row.snapTime ?? row.createdAt,
                                            filters.clientId
                                                ? clientTimezoneOffsetMinutes
                                                : (clients.find(
                                                      (c) =>
                                                          c.id === row.clientId,
                                                  )?.timezoneOffsetMinutes ??
                                                      0),
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {confidenceBadge(row.confidence)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {row.direction?.trim()
                                            ? row.direction
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {row.cutoutPicKey ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0"
                                                aria-label={`Ver foto do acesso da placa ${row.plateNumber}`}
                                                onClick={() =>
                                                    void openLprPhotos(
                                                        row.id,
                                                        row.plateNumber,
                                                    )
                                                }
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground tabular-nums">
                                                —
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {data.total > 0 ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        {data.total} registro{data.total !== 1 ? "s" : ""} —
                        página {data.page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending || data.page <= 1}
                            onClick={() => goPage(data.page - 1)}
                        >
                            <ChevronLeft className="size-4" />
                            Anterior
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending || data.page >= totalPages}
                            onClick={() => goPage(data.page + 1)}
                        >
                            Próxima
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
