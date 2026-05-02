"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { AccessesListResponse, ClientListRow } from "@/types/domain";
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

function similarityBadge(similarity: number | null) {
    if (similarity == null || Number.isNaN(similarity)) {
        return (
            <Badge variant="secondary" className="font-normal tabular-nums">
                —
            </Badge>
        );
    }
    if (similarity >= 80) {
        return (
            <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-normal text-emerald-800 tabular-nums hover:bg-emerald-50"
            >
                {similarity}%
            </Badge>
        );
    }
    if (similarity >= 60) {
        return (
            <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 font-normal text-amber-900 tabular-nums hover:bg-amber-50"
            >
                {similarity}%
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="font-normal tabular-nums">
            {similarity}%
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
    data: AccessesListResponse;
    clients: ClientListRow[];
    /** Offset quando há filtro por cliente; listagem mista usa o offset de cada cliente. */
    clientTimezoneOffsetMinutes: number;
    filters: {
        clientId: string;
        startDate: string;
        endDate: string;
    };
};

export function AccessesTable({
    data,
    clients,
    clientTimezoneOffsetMinutes,
    filters,
}: Props) {
    const router = useRouter();
    const params = useSearchParams();
    const [pending, startTransition] = useTransition();

    const totalPages = useMemo(
        () =>
            Math.max(1, Math.ceil(data.total / Math.max(1, data.pageSize))),
        [data.total, data.pageSize],
    );

    const buildHref = useCallback(
        (patch: Record<string, string | undefined>) => {
            const next = new URLSearchParams(params?.toString() ?? "");
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
            <form
                onSubmit={applyFilters}
                className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
            >
                <div className="grid flex-1 gap-2 min-w-[200px]">
                    <Label htmlFor="filter-client">Cliente</Label>
                    <select
                        id="filter-client"
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
                    <Label htmlFor="filter-start">De</Label>
                    <Input
                        id="filter-start"
                        name="startDate"
                        type="date"
                        defaultValue={filters.startDate}
                    />
                </div>
                <div className="grid gap-2 min-w-[160px]">
                    <Label htmlFor="filter-end">Até</Label>
                    <Input
                        id="filter-end"
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
                            <TableHead>Pessoa</TableHead>
                            <TableHead>Leitor</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Horário</TableHead>
                            <TableHead className="text-right">
                                Similaridade
                            </TableHead>
                            <TableHead>Evento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.items.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Nenhum acesso encontrado para os filtros
                                    atuais.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.items.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.personName?.trim() ||
                                            `Face #${row.userId}`}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.readerName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {row.clientName}
                                    </TableCell>
                                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                                        {formatDateTime(
                                            row.eventDate ?? row.createdAt,
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
                                        {similarityBadge(row.similarity)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">
                                            {row.eventCode}
                                        </span>
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
