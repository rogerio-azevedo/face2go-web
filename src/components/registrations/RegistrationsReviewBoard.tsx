"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import {
    approveClientRegistrationAction,
    blockClientRegistrationAction,
    deleteClientRegistrationAction,
    getClientRegistrationFaceUrlAction,
    rejectClientRegistrationAction,
    restoreClientRegistrationAction,
    unblockClientRegistrationAction,
} from "@/app/client/cadastros/actions";
import {
    approveCompanyRegistrationAction,
    blockCompanyRegistrationAction,
    deleteCompanyRegistrationAction,
    getCompanyRegistrationFaceUrlAction,
    rejectCompanyRegistrationAction,
    restoreCompanyRegistrationAction,
    unblockCompanyRegistrationAction,
} from "@/app/company/clientes/[clientId]/usuarios/actions";
import { ExportRegistrationsExcelButton } from "@/features/registrations/components/ExportRegistrationsExcelButton";
import { RegistrationEditSheet } from "@/features/registrations/components/RegistrationEditSheet";
import { RegistrationsFaceSyncAllModal } from "@/features/registrations/components/RegistrationsFaceSyncAllModal";
import { RegistrationRowActions } from "@/features/registrations/components/RegistrationRowActions";
import { DeviceSyncStatusBadge } from "@/components/company/clientes/escola/DeviceSyncStatusBadge";
import { UnblockPersonDialog } from "@/components/company/clientes/escola/UnblockPersonDialog";
import { listRegistrationsAction } from "@/features/registrations/actions/list";
import { emptyRegistrationsPage } from "@/lib/pagination";
import { formatCpfOrCnpj } from "@/lib/utils/document";
import { useRegistrationFaceSync } from "@/features/registrations/hooks/use-registration-face-sync";
import { useRegistrationBatchSync } from "@/features/registrations/hooks/use-registration-batch-sync";
import { deferInEffect } from "@/lib/defer-in-effect";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import type {
    ClientRegistrationListRow,
    DeviceSyncStatus,
    PaginatedRegistrationsResponse,
} from "@/types/domain";
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

type Tab = "draft" | "approved" | "rejected" | "blocked" | "deleted";
type SortField = "submittedAt" | "name" | "local";
type SortDir = "asc" | "desc";

const TAB_LABELS: Record<Tab, string> = {
    draft: "Aguardando aprovação",
    approved: "Aprovados",
    rejected: "Rejeitados",
    blocked: "Bloqueados",
    deleted: "Excluídos",
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

/** YYYY-MM-DD → DD/MM/AAAA, sem Date() para evitar deslocamento de fuso. */
function formatBirthDate(iso: string | null) {
    if (!iso) return "—";
    const [year, month, day] = iso.slice(0, 10).split("-");
    if (!year || !month || !day) return iso;
    return `${day}/${month}/${year}`;
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
    isAdmin = false,
    clientType: clientTypeProp,
    linksPanel,
    linksCount,
}: {
    variant: "client" | "company";
    companyClientId?: string;
    isAdmin?: boolean;
    clientType?: string | null;
    linksPanel?: ReactNode;
    linksCount?: number;
}) {
    const [page, setPage] = useState<PaginatedRegistrationsResponse>(
        emptyRegistrationsPage(),
    );
    const [tab, setTab] = useState<Tab>("draft");
    const [search, setSearch] = useState("");
    const [block, setBlock] = useState("");
    const [unit, setUnit] = useState("");
    const [room, setRoom] = useState("");
    const [sortField, setSortField] = useState<SortField>("submittedAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [activeRow, setActiveRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [faceUrl, setFaceUrl] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState("");
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [forceRow, setForceRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [unblockOpen, setUnblockOpen] = useState(false);
    const [editRow, setEditRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [pending, startTransition] = useTransition();
    const [showLinks, setShowLinks] = useState(false);

    const fetchList = useCallback(
        async (
            nextPage: number,
            nextSearch: string,
            nextTab: Tab,
            opts?: { silent?: boolean },
        ) => {
            if (!opts?.silent) setLoading(true);
            try {
                const r = await listRegistrationsAction(variant, {
                    companyClientId,
                    page: nextPage,
                    pageSize: page.pageSize,
                    search: nextSearch || undefined,
                    block: block || undefined,
                    unit: unit || undefined,
                    room: room || undefined,
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
                setActiveRow((prev) => {
                    if (!prev) return prev;
                    return (
                        r.result.data.find((row) => row.id === prev.id) ?? prev
                    );
                });
                return r.result;
            } finally {
                if (!opts?.silent) setLoading(false);
            }
        },
        [variant, companyClientId, page.pageSize, block, unit, room],
    );

    const { runSync } = useRegistrationFaceSync({
        variant,
        companyClientId,
        onAfterSync: () => {
            void fetchList(page.page, search, tab, { silent: true });
        },
    });

    useRegistrationBatchSync({
        variant,
        companyClientId,
        onFinished: () => {
            void fetchList(page.page, search, tab, { silent: true });
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

    const toggleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            return;
        }
        setSortField(field);
        setSortDir(field === "submittedAt" ? "desc" : "asc");
    }, [sortField]);

    const resetToFirstPage = useCallback(() => {
        setPage((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }, []);

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearch(value);
            resetToFirstPage();
        },
        [resetToFirstPage],
    );

    const handleBlockChange = useCallback(
        (value: string) => {
            setBlock(value);
            resetToFirstPage();
        },
        [resetToFirstPage],
    );

    const handleUnitChange = useCallback(
        (value: string) => {
            setUnit(value);
            resetToFirstPage();
        },
        [resetToFirstPage],
    );

    const handleRoomChange = useCallback(
        (value: string) => {
            setRoom(value);
            resetToFirstPage();
        },
        [resetToFirstPage],
    );

    const locationType = clientTypeProp ?? page.clientType;
    const showBlockUnit = locationType === "condominium";
    const showRoom =
        locationType === "office" || locationType === "clinic";

    function handleTabChange(next: Tab) {
        setShowLinks(false);
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

    function doBlock() {
        if (!activeRow) return;
        const reason = rejectNotes.trim();
        if (reason.length < 3) {
            toast.error("Informe o motivo do bloqueio (mínimo 3 caracteres).");
            return;
        }
        startTransition(async () => {
            const res =
                variant === "client"
                    ? await blockClientRegistrationAction(activeRow.id, reason)
                    : await blockCompanyRegistrationAction(
                          companyClientId!,
                          activeRow.id,
                          reason,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Cadastro bloqueado. A face será enviada ao leitor sem abrir a porta.");
            setSheetOpen(false);
            void fetchList(page.page, search, tab);
        });
    }

    function doUnblock() {
        if (!activeRow) return;
        startTransition(async () => {
            const res =
                variant === "client"
                    ? await unblockClientRegistrationAction(activeRow.id)
                    : await unblockCompanyRegistrationAction(
                          companyClientId!,
                          activeRow.id,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success(
                "Cadastro desbloqueado. A face volta ao leitor com acesso normal.",
            );
            setUnblockOpen(false);
            setSheetOpen(false);
            setPage((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
            setTab("approved");
        });
    }

    async function runSyncFace(
        row: ClientRegistrationListRow,
        options?: { force?: boolean },
    ) {
        if (variant === "company" && !companyClientId) {
            toast.error("Cliente inválido.");
            return;
        }
        setSyncingId(row.id);
        try {
            const result = await runSync(row.id, row.name ?? "Cadastro", options);
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

    async function runDelete(row: ClientRegistrationListRow) {
        const res =
            variant === "client"
                ? await deleteClientRegistrationAction(row.id)
                : await deleteCompanyRegistrationAction(
                      companyClientId ?? "",
                      row.id,
                  );
        if ("error" in res) {
            toast.error(res.error);
            return;
        }
        toast.success("Cadastro excluído.");
        void fetchList(page.page, search, tab);
    }

    async function runRestore(row: ClientRegistrationListRow) {
        const res =
            variant === "client"
                ? await restoreClientRegistrationAction(row.id)
                : await restoreCompanyRegistrationAction(
                      companyClientId ?? "",
                      row.id,
                  );
        if ("error" in res) {
            toast.error(res.error);
            return;
        }
        toast.success("Cadastro restaurado. A face será reenviada aos leitores.");
        void fetchList(page.page, search, tab);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(TAB_LABELS) as Tab[]).map((k) => (
                    <Button
                        key={k}
                        type="button"
                        size="sm"
                        variant={!showLinks && tab === k ? "default" : "outline"}
                        onClick={() => handleTabChange(k)}
                    >
                        {TAB_LABELS[k]}
                        <span className="ml-1.5 rounded-md bg-background/20 px-1.5 text-xs">
                            {page.counts[k]}
                        </span>
                    </Button>
                ))}
                {linksPanel ? (
                    <Button
                        type="button"
                        size="sm"
                        variant={showLinks ? "default" : "outline"}
                        onClick={() => setShowLinks(true)}
                    >
                        Links de cadastro
                        {linksCount != null ? (
                            <span className="ml-1.5 rounded-md bg-background/20 px-1.5 text-xs">
                                {linksCount}
                            </span>
                        ) : null}
                    </Button>
                ) : null}
                <div className="ml-auto">
                    <ExportRegistrationsExcelButton
                        variant={variant}
                        companyClientId={companyClientId}
                        search={search}
                        block={block}
                        unit={unit}
                        room={room}
                    />
                </div>
            </div>

            {showLinks && linksPanel ? (
                linksPanel
            ) : (
            <>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <SearchInput
                    id="search-registrations"
                    value={search}
                    onValueChange={handleSearchChange}
                    placeholder="Buscar por nome ou CPF…"
                    className="sm:max-w-sm"
                />
                {showBlockUnit ? (
                    <>
                        <SearchInput
                            id="search-registrations-block"
                            value={block}
                            onValueChange={handleBlockChange}
                            placeholder="Bloco"
                            className="min-w-32 sm:max-w-40"
                        />
                        <SearchInput
                            id="search-registrations-unit"
                            value={unit}
                            onValueChange={handleUnitChange}
                            placeholder="Unidade"
                            className="min-w-32 sm:max-w-40"
                        />
                    </>
                ) : null}
                {showRoom ? (
                    <SearchInput
                        id="search-registrations-room"
                        value={room}
                        onValueChange={handleRoomChange}
                        placeholder="Sala"
                        className="min-w-32 sm:max-w-40"
                    />
                ) : null}
                <div className="sm:ml-auto">
                    <RegistrationsFaceSyncAllModal
                        variant={variant}
                        companyClientId={companyClientId}
                    />
                </div>
            </div>

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
                                CPF
                            </TableHead>
                            <TableHead className="hidden sm:table-cell">
                                Nascimento
                            </TableHead>
                            <SortableHead
                                label="Local"
                                active={sortField === "local"}
                                dir={sortDir}
                                onClick={() => toggleSort("local")}
                                className="hidden md:table-cell"
                            />
                            <TableHead className="hidden md:table-cell">
                                Link
                            </TableHead>
                            <SortableHead
                                label="Enviado"
                                active={sortField === "submittedAt"}
                                dir={sortDir}
                                onClick={() => toggleSort("submittedAt")}
                            />
                            <TableHead className="w-[100px] text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Nenhum registro nesta lista.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={
                                        tab === "deleted"
                                            ? "text-muted-foreground"
                                            : undefined
                                    }
                                >
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
                                            <span className="flex flex-wrap items-center gap-1.5">
                                                {row.name ?? "—"}
                                                {row.isMinor ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-orange-300 bg-orange-100 font-semibold text-orange-900 hover:bg-orange-100"
                                                        title="Não é sincronizado em leitores com restrição de menor"
                                                    >
                                                        Menor
                                                    </Badge>
                                                ) : null}
                                                {tab === "deleted" ? (
                                                    <Badge variant="secondary">
                                                        Excluído
                                                    </Badge>
                                                ) : null}
                                            </span>
                                            {(tab === "approved" ||
                                                tab === "blocked") &&
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
                                                        syncedCount={
                                                            row.readerSyncSynced
                                                        }
                                                        totalCount={
                                                            row.readerSyncTotal
                                                        }
                                                        isMinor={row.isMinor}
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
                                    <TableCell className="hidden font-mono text-xs sm:table-cell">
                                        {row.document
                                            ? formatCpfOrCnpj(row.document)
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="hidden text-xs sm:table-cell">
                                        {formatBirthDate(row.birthDate)}
                                    </TableCell>
                                    <TableCell className="hidden text-xs md:table-cell">
                                        {extraSummary(row)}
                                    </TableCell>
                                    <TableCell className="hidden font-mono text-xs md:table-cell">
                                        {row.registrationLinkCode ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatWhen(row.submittedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <RegistrationRowActions
                                            row={row}
                                            tab={tab}
                                            isAdmin={isAdmin}
                                            busy={
                                                pending || syncingId === row.id
                                            }
                                            onView={() => void openDetail(row)}
                                            onSync={() => void runSyncFace(row)}
                                            onForceSync={() => setForceRow(row)}
                                            onEdit={() => setEditRow(row)}
                                            onDelete={() => runDelete(row)}
                                            onRestore={() => runRestore(row)}
                                        />
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
            </>
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent
                    side="right"
                    className="w-full data-[side=right]:sm:max-w-xl"
                >
                    <SheetHeader>
                        <SheetTitle>
                            {activeRow?.name ?? "Cadastro"}
                        </SheetTitle>
                        <SheetDescription>
                            {activeRow ? (
                                <>
                                    Documento:{" "}
                                    {activeRow.document
                                        ? formatCpfOrCnpj(activeRow.document)
                                        : "—"}{" "}
                                    ·{" "}
                                    {activeRow.phone ?? "—"}
                                </>
                            ) : null}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-3 px-4">
                        {activeRow ? (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    Nascimento:{" "}
                                    {formatBirthDate(activeRow.birthDate)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    E-mail: {activeRow.email ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Local: {extraSummary(activeRow)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Declaração de veracidade:{" "}
                                    {activeRow.truthDeclaredAt
                                        ? `aceita em ${formatWhen(activeRow.truthDeclaredAt)}`
                                        : "não registrada"}
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
                                              : activeRow.status === "blocked"
                                                ? "Bloqueado"
                                                : "Rejeitado"}
                                    </Badge>
                                </div>
                                {activeRow.status === "rejected" ? (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-destructive">
                                            Motivo:{" "}
                                            {activeRow.rejectionNotes?.trim() ||
                                                "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Rejeitado em{" "}
                                            {formatWhen(activeRow.approvedAt)}
                                        </p>
                                    </div>
                                ) : null}
                                {activeRow.status === "blocked" ? (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-destructive">
                                            Motivo:{" "}
                                            {activeRow.blockReason ?? "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Bloqueado em{" "}
                                            {formatWhen(activeRow.blockedAt)}
                                        </p>
                                    </div>
                                ) : null}
                                {activeRow.status === "approved" ||
                                activeRow.status === "blocked" ? (
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
                                                    syncedCount={
                                                        activeRow.readerSyncSynced
                                                    }
                                                    totalCount={
                                                        activeRow.readerSyncTotal
                                                    }
                                                    isMinor={activeRow.isMinor}
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
                                {activeRow.status === "draft" ||
                                activeRow.status === "approved" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="reject-notes">
                                            {activeRow.status === "approved"
                                                ? "Motivo do bloqueio"
                                                : "Motivo (rejeição opcional / bloqueio obrigatório)"}
                                        </Label>
                                        <textarea
                                            id="reject-notes"
                                            value={rejectNotes}
                                            onChange={(e) =>
                                                setRejectNotes(e.target.value)
                                            }
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-[72px] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3"
                                            placeholder="Descreva o motivo…"
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
                                variant="outline"
                                disabled={pending}
                                onClick={() => setEditRow(activeRow)}
                            >
                                Editar
                            </Button>
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
                                variant="outline"
                                disabled={pending}
                                onClick={doBlock}
                            >
                                Bloquear
                            </Button>
                            <Button
                                type="button"
                                disabled={pending}
                                onClick={doApprove}
                            >
                                Aprovar
                            </Button>
                        </SheetFooter>
                    ) : activeRow?.status === "approved" ? (
                        <SheetFooter className="flex-row flex-wrap gap-2 sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={pending}
                                onClick={doBlock}
                            >
                                Bloquear
                            </Button>
                            {activeRow.faceId != null &&
                            activeRow.hasFacialReaders ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-1.5"
                                        disabled={pending}
                                        onClick={() => setForceRow(activeRow)}
                                    >
                                        <RotateCcw className="size-4" />
                                        Forçar sync
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={pending}
                                        onClick={doSyncActiveFace}
                                    >
                                        Sincronizar leitor
                                    </Button>
                                </>
                            ) : null}
                        </SheetFooter>
                    ) : activeRow?.status === "blocked" ? (
                        <SheetFooter className="flex-row flex-wrap gap-2 sm:justify-end">
                            <Button
                                type="button"
                                disabled={pending}
                                onClick={() => setUnblockOpen(true)}
                            >
                                Desbloquear
                            </Button>
                            {activeRow.faceId != null &&
                            activeRow.hasFacialReaders ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-1.5"
                                        disabled={pending}
                                        onClick={() => setForceRow(activeRow)}
                                    >
                                        <RotateCcw className="size-4" />
                                        Forçar sync
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={pending}
                                        onClick={doSyncActiveFace}
                                    >
                                        Sincronizar leitor
                                    </Button>
                                </>
                            ) : null}
                        </SheetFooter>
                    ) : null}
                </SheetContent>
            </Sheet>

            <RegistrationEditSheet
                open={editRow != null}
                onOpenChange={(open) => {
                    if (!open) setEditRow(null);
                }}
                row={editRow}
                clientType={page.clientType ?? null}
                variant={variant}
                companyClientId={companyClientId}
                onSuccess={() => {
                    void fetchList(page.page, search, tab);
                }}
            />

            <UnblockPersonDialog
                open={unblockOpen}
                onOpenChange={setUnblockOpen}
                personName={activeRow?.name ?? "cadastro"}
                busy={pending}
                onConfirm={async () => {
                    doUnblock();
                }}
            />

            <AlertDialog
                open={forceRow != null}
                onOpenChange={(open) => {
                    if (!open) setForceRow(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Forçar sincronização?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Reenvia {forceRow?.name ?? "este cadastro"} a todos
                            os leitores, inclusive os já sincronizados. Use se a
                            foto sumiu no equipamento ou o status ficou
                            inconsistente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pending}
                            onClick={(e) => {
                                e.preventDefault();
                                if (!forceRow) return;
                                const row = forceRow;
                                setForceRow(null);
                                void runSyncFace(row, { force: true });
                            }}
                        >
                            Forçar sync
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
