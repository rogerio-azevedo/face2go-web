"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    approveClientRegistrationAction,
    getClientRegistrationFaceUrlAction,
    rejectClientRegistrationAction,
} from "@/app/client/usuarios/actions";
import {
    approveCompanyRegistrationAction,
    getCompanyRegistrationFaceUrlAction,
    rejectCompanyRegistrationAction,
} from "@/app/company/clientes/[clientId]/usuarios/actions";
import { FaceSyncResultModal } from "@/components/company/clientes/escola/FaceSyncResultModal";
import { DeviceSyncStatusBadge } from "@/components/company/clientes/escola/DeviceSyncStatusBadge";
import { listRegistrationsAction } from "@/features/registrations/actions/list";
import { emptyRegistrationsPage } from "@/lib/pagination";
import { useRegistrationFaceSync } from "@/features/registrations/hooks/use-registration-face-sync";
import { deferInEffect } from "@/lib/defer-in-effect";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import type {
    ClientRegistrationListRow,
    DeviceSyncStatus,
    PaginatedRegistrationsResponse,
} from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaceCirclePhoto } from "@/components/ui/face-circle-photo";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Tab = "draft" | "approved" | "rejected";
type SortField = "submittedAt" | "name" | "local";
type SortDir = "asc" | "desc";

const TAB_LABELS: Record<Tab, string> = {
    draft: "Aguardando aprovação",
    approved: "Aprovados",
    rejected: "Rejeitados",
};

function formatWhen(iso: string | null) {
    if (!iso) return "—";
    try {
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function extraSummary(row: ClientRegistrationListRow): string {
    const d = row.additionalData;
    if (!d || typeof d !== "object") return "—";
    if ("block" in d && "unit" in d) {
        return `Bloco ${String(d.block)} · Unid. ${String(d.unit)}`;
    }
    if ("room" in d) {
        return `Sala ${String(d.room)}`;
    }
    return "—";
}

function compareRows(
    a: ClientRegistrationListRow,
    b: ClientRegistrationListRow,
    field: SortField,
    dir: SortDir,
): number {
    let cmp = 0;
    if (field === "name") {
        cmp = (a.name ?? "").localeCompare(b.name ?? "", "pt-BR", {
            sensitivity: "base",
        });
    } else if (field === "local") {
        cmp = extraSummary(a).localeCompare(extraSummary(b), "pt-BR", {
            sensitivity: "base",
        });
    } else {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        cmp = ta - tb;
    }
    return dir === "asc" ? cmp : -cmp;
}

function SortableHead({
    label,
    active,
    dir,
    onClick,
    className,
}: {
    label: string;
    active: boolean;
    dir: SortDir;
    onClick: () => void;
    className?: string;
}) {
    const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
        <TableHead className={className}>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 gap-1 px-2 font-medium"
                onClick={onClick}
                aria-sort={
                    active ? (dir === "asc" ? "ascending" : "descending") : "none"
                }
            >
                {label}
                <Icon className="size-3.5 opacity-60" aria-hidden />
            </Button>
        </TableHead>
    );
}

export function RegistrationsReviewBoard({
    variant,
    companyClientId,
}: {
    variant: "client" | "company";
    companyClientId?: string;
}) {
    const [page, setPage] = useState<PaginatedRegistrationsResponse>(
        emptyRegistrationsPage(),
    );
    const [tab, setTab] = useState<Tab>("draft");
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("submittedAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [activeRow, setActiveRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [faceUrl, setFaceUrl] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState("");
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [pending, startTransition] = useTransition();

    const fetchList = useCallback(
        async (nextPage: number, nextSearch: string, nextTab: Tab) => {
            setLoading(true);
            try {
                const r = await listRegistrationsAction(variant, {
                    companyClientId,
                    page: nextPage,
                    pageSize: page.pageSize,
                    search: nextSearch || undefined,
                    status: nextTab,
                });
                if (!r.ok) {
                    toast.error(r.error);
                    return null;
                }
                const lastPage = Math.max(
                    1,
                    Math.ceil(r.result.total / r.result.pageSize) || 1,
                );
                if (r.result.data.length === 0 && r.result.page > lastPage) {
                    setPage((prev) => ({ ...prev, page: lastPage }));
                    return r.result;
                }
                setPage(r.result);
                return r.result;
            } finally {
                setLoading(false);
            }
        },
        [variant, companyClientId, page.pageSize],
    );

    const { syncModalState, runSync, closeSyncResult } = useRegistrationFaceSync({
        variant,
        companyClientId,
        onAfterSync: () => {
            void fetchList(page.page, search, tab);
        },
    });

    useEffect(() => {
        deferInEffect(() => {
            void fetchList(page.page, search, tab);
        });
    }, [page.page, search, tab, fetchList]);

    const filtered = useMemo(() => {
        return [...page.data].sort((a, b) =>
            compareRows(a, b, sortField, sortDir),
        );
    }, [page.data, sortField, sortDir]);

    const toggleSort = useCallback((field: "name" | "local") => {
        setSortField((current) => {
            if (current === field) {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                return field;
            }
            setSortDir("asc");
            return field;
        });
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setPage((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }, []);

    function handleTabChange(next: Tab) {
        setTab(next);
        setPage((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }

    async function openDetail(row: ClientRegistrationListRow) {
        setActiveRow(row);
        setFaceUrl(null);
        setRejectNotes("");
        setSheetOpen(true);
        if (!row.hasFacePhoto) return;
        if (variant === "client") {
            const r = await getClientRegistrationFaceUrlAction(row.id);
            if ("url" in r) setFaceUrl(r.url);
            else toast.error(r.error);
        } else if (companyClientId) {
            const r = await getCompanyRegistrationFaceUrlAction(
                companyClientId,
                row.id,
            );
            if ("url" in r) setFaceUrl(r.url);
            else toast.error(r.error);
        }
    }

    function doApprove() {
        if (!activeRow) return;
        startTransition(async () => {
            const res =
                variant === "client"
                    ? await approveClientRegistrationAction(activeRow.id)
                    : await approveCompanyRegistrationAction(
                          companyClientId!,
                          activeRow.id,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Cadastro aprovado.");
            setSheetOpen(false);
            void fetchList(page.page, search, tab);
        });
    }

    function doReject() {
        if (!activeRow) return;
        startTransition(async () => {
            const res =
                variant === "client"
                    ? await rejectClientRegistrationAction(
                          activeRow.id,
                          rejectNotes,
                      )
                    : await rejectCompanyRegistrationAction(
                          companyClientId!,
                          activeRow.id,
                          rejectNotes,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Cadastro rejeitado.");
            setSheetOpen(false);
            void fetchList(page.page, search, tab);
        });
    }

    async function runSyncFace(row: ClientRegistrationListRow) {
        if (variant === "company" && !companyClientId) {
            toast.error("Cliente inválido.");
            return;
        }
        setSyncingId(row.id);
        try {
            const result = await runSync(row.id, row.name ?? "Cadastro");
            if (!result) return;

            const patch = {
                deviceSyncStatus: result.deviceSyncStatus as DeviceSyncStatus,
                deviceSyncError: result.deviceSyncError,
            };
            setPage((prev) => ({
                ...prev,
                data: prev.data.map((r) =>
                    r.id === row.id ? { ...r, ...patch } : r,
                ),
            }));
            setActiveRow((prev) =>
                prev?.id === row.id ? { ...prev, ...patch } : prev,
            );
        } finally {
            setSyncingId(null);
        }
    }

    function doSyncActiveFace() {
        if (!activeRow) return;
        void runSyncFace(activeRow);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {(Object.keys(TAB_LABELS) as Tab[]).map((k) => (
                    <Button
                        key={k}
                        type="button"
                        size="sm"
                        variant={tab === k ? "default" : "outline"}
                        onClick={() => handleTabChange(k)}
                    >
                        {TAB_LABELS[k]}
                        <span className="ml-1.5 rounded-md bg-background/20 px-1.5 text-xs">
                            {page.counts[k]}
                        </span>
                    </Button>
                ))}
            </div>

            <SearchInput
                id="search-registrations"
                value={search}
                onValueChange={handleSearchChange}
                placeholder="Buscar por nome, CPF ou local…"
                className="sm:max-w-sm"
            />

            <div className="relative rounded-md border">
                {loading ? (
                    <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-md">
                        <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                ) : null}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[52px]" aria-label="Foto" />
                            <SortableHead
                                label="Nome"
                                active={sortField === "name"}
                                dir={sortDir}
                                onClick={() => toggleSort("name")}
                            />
                            <TableHead className="hidden sm:table-cell">
                                E-mail
                            </TableHead>
                            <SortableHead
                                label="Local"
                                active={sortField === "local"}
                                dir={sortDir}
                                onClick={() => toggleSort("local")}
                                className="hidden md:table-cell"
                            />
                            <TableHead>Enviado</TableHead>
                            <TableHead className="w-[100px] text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Nenhum registro nesta lista.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="align-middle">
                                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                                            <FaceCirclePhoto
                                                className="size-full"
                                                photoUrl={row.faceUrl ?? null}
                                                nameHint={row.name ?? null}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col gap-1">
                                            <span>{row.name ?? "—"}</span>
                                            {tab === "approved" &&
                                                row.faceId != null &&
                                                row.hasFacialReaders ? (
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px]"
                                                    >
                                                        ID leitor {row.faceId}
                                                    </Badge>
                                                    <DeviceSyncStatusBadge
                                                        status={
                                                            row.deviceSyncStatus
                                                        }
                                                        hasFace={
                                                            row.faceId != null
                                                        }
                                                        hasReaders={
                                                            row.hasFacialReaders
                                                        }
                                                        error={
                                                            row.deviceSyncError
                                                        }
                                                    />
                                                </div>
                                            ) : null}
                                            {tab === "approved" &&
                                                row.faceId == null &&
                                                !row.hasFacePhoto ? (
                                                <span className="text-muted-foreground text-[10px]">
                                                    Sem foto (não há envio ao
                                                    leitor)
                                                </span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden max-w-[200px] truncate text-xs sm:table-cell">
                                        {row.email ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden text-xs md:table-cell">
                                        {extraSummary(row)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatWhen(row.submittedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDetail(row)}
                                            >
                                                Ver
                                            </Button>
                                            {tab === "approved" &&
                                            row.faceId != null ? (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={
                                                        pending ||
                                                        syncingId === row.id
                                                    }
                                                    onClick={() =>
                                                        void runSyncFace(row)
                                                    }
                                                >
                                                    Sync leitor
                                                </Button>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                page={page.page}
                pageSize={page.pageSize}
                total={page.total}
                onPageChange={(next) =>
                    setPage((prev) => ({ ...prev, page: next }))
                }
                disabled={loading || pending}
            />

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {activeRow?.name ?? "Cadastro"}
                        </SheetTitle>
                        <SheetDescription>
                            {activeRow ? (
                                <>
                                    Documento: {activeRow.document ?? "—"} ·{" "}
                                    {activeRow.phone ?? "—"}
                                </>
                            ) : null}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-3 px-4">
                        {activeRow ? (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    E-mail: {activeRow.email ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Local: {extraSummary(activeRow)}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        Status:
                                    </span>
                                    <Badge>
                                        {activeRow.status === "draft"
                                            ? "Aguardando"
                                            : activeRow.status === "approved"
                                              ? "Aprovado"
                                              : "Rejeitado"}
                                    </Badge>
                                </div>
                                {activeRow.status === "approved" ? (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs text-muted-foreground">
                                            Face ID no leitor:{" "}
                                            {activeRow.faceId != null
                                                ? String(activeRow.faceId)
                                                : "—"}
                                        </p>
                                        {activeRow.faceId != null &&
                                        activeRow.hasFacialReaders ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    Sincronização:
                                                </span>
                                                <DeviceSyncStatusBadge
                                                    status={
                                                        activeRow.deviceSyncStatus
                                                    }
                                                    hasFace={
                                                        activeRow.faceId != null
                                                    }
                                                    hasReaders={
                                                        activeRow.hasFacialReaders
                                                    }
                                                    error={
                                                        activeRow.deviceSyncError
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                        {activeRow.deviceSyncError ? (
                                            <p className="text-destructive text-xs">
                                                {activeRow.deviceSyncError}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                                {faceUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária do R2
                                    <img
                                        src={faceUrl}
                                        alt="Foto enviada"
                                        className="max-h-64 w-full rounded-lg border object-contain"
                                    />
                                ) : activeRow.hasFacePhoto ? (
                                    <p className="text-xs text-muted-foreground">
                                        Carregando foto…
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Sem foto.
                                    </p>
                                )}
                                {activeRow.status === "draft" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="reject-notes">
                                            Motivo da rejeição (opcional)
                                        </Label>
                                        <textarea
                                            id="reject-notes"
                                            value={rejectNotes}
                                            onChange={(e) =>
                                                setRejectNotes(e.target.value)
                                            }
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-[72px] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3"
                                            placeholder="Observação para o solicitante…"
                                        />
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                    </div>
                    {activeRow?.status === "draft" ? (
                        <SheetFooter className="flex-row flex-wrap gap-2 sm:justify-end">
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={pending}
                                onClick={doReject}
                            >
                                Rejeitar
                            </Button>
                            <Button
                                type="button"
                                disabled={pending}
                                onClick={doApprove}
                            >
                                Aprovar
                            </Button>
                        </SheetFooter>
                    ) : activeRow?.status === "approved" &&
                      activeRow.faceId != null &&
                      activeRow.hasFacialReaders ? (
                        <SheetFooter className="sm:justify-end">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={pending}
                                onClick={doSyncActiveFace}
                            >
                                Sincronizar leitor
                            </Button>
                        </SheetFooter>
                    ) : null}
                </SheetContent>
            </Sheet>

            <FaceSyncResultModal
                state={syncModalState}
                onClose={closeSyncResult}
            />
        </div>
    );
}
