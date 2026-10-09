"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useTransition,
    type ReactNode,
} from "react";
import { toast } from "sonner";

import {
    deleteClientRegistrationAction,
    restoreClientRegistrationAction,
} from "@/app/client/cadastros/actions";
import {
    deleteCompanyRegistrationAction,
    restoreCompanyRegistrationAction,
} from "@/app/company/clientes/[clientId]/usuarios/actions";
import { listClientBlocksAction } from "@/features/client-blocks/actions";
import { AllowSimilarFaceDialog } from "@/features/faces/components/AllowSimilarFaceDialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
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
import { createFaceRetakeLinkAction } from "@/features/registrations/actions/face-retake";
import { FaceRetakeLinkDialog } from "@/features/registrations/components/FaceRetakeLinkDialog";
import { RegistrationDecisionDialog } from "@/features/registrations/components/RegistrationDecisionDialog";
import type { RegistrationDecision } from "@/features/registrations/components/RegistrationDecisionDialog";
import { RegistrationDetailSheet } from "@/features/registrations/components/RegistrationDetailSheet";
import { RegistrationTimelineSheet } from "@/features/registrations/components/RegistrationTimelineSheet";
import { RegistrationEditSheet } from "@/features/registrations/components/RegistrationEditSheet";
import { RegistrationsMobileList } from "@/features/registrations/components/RegistrationsMobileList";
import { RegistrationsTable } from "@/features/registrations/components/RegistrationsTable";
import { RegistrationsToolbar } from "@/features/registrations/components/RegistrationsToolbar";
import { useRegistrationBatchSync } from "@/features/registrations/hooks/use-registration-batch-sync";
import { useRegistrationFaceSync } from "@/features/registrations/hooks/use-registration-face-sync";
import { useRegistrationReviewActions } from "@/features/registrations/hooks/use-registration-review-actions";
import {
    invalidateRegistrationsList,
    registrationsListQueryKey,
    useRegistrationsList,
} from "@/features/registrations/hooks/use-registrations-list";
import {
    compareRegistrationRows,
    type RegistrationListTab,
    type RegistrationSortDir,
    type RegistrationSortField,
} from "@/features/registrations/lib/registration-format";
import { useDeepLinkRow } from "@/hooks/use-deep-link-row";
import { deferInEffect } from "@/lib/defer-in-effect";
import {
    DEFAULT_SCHOOL_PAGE_SIZE,
    PAGE_SIZE_OPTIONS,
    totalPages,
} from "@/lib/pagination";
import type {
    ClientRegistrationListRow,
    DeviceSyncStatus,
    PaginatedRegistrationsResponse,
} from "@/types/domain";

const DECISION_SUCCESS = {
    approve: "Cadastro aprovado.",
    reject: "Cadastro rejeitado.",
    block: "Cadastro bloqueado. A face será enviada ao leitor sem abrir a porta.",
    unblock:
        "Cadastro desbloqueado. A face volta ao leitor com acesso normal.",
} as const;

export function RegistrationsReviewBoard({
    variant,
    companyClientId,
    blocksClientId,
    isAdmin = false,
    clientType: clientTypeProp,
    linksPanel,
    linksCount,
    initialShowLinks = false,
    initialTab = "draft",
    initialSearch = "",
    initialOpenId,
}: {
    variant: "client" | "company";
    companyClientId?: string;
    blocksClientId?: string;
    isAdmin?: boolean;
    clientType?: string | null;
    linksPanel?: ReactNode;
    linksCount?: number;
    initialShowLinks?: boolean;
    initialTab?: RegistrationListTab;
    initialSearch?: string;
    initialOpenId?: string;
}) {
    const queryClient = useQueryClient();
    const review = useRegistrationReviewActions({ variant, companyClientId });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_SCHOOL_PAGE_SIZE);
    const [tab, setTab] = useState<RegistrationListTab>(initialTab);
    const [search, setSearch] = useState(initialSearch);
    const consumeDeepLink = useDeepLinkRow(initialOpenId);
    const [blockId, setBlockId] = useState("");
    const [unitId, setUnitId] = useState("");
    const [room, setRoom] = useState("");
    const [sortField, setSortField] = useState<RegistrationSortField>("submittedAt");
    const [sortDir, setSortDir] = useState<RegistrationSortDir>("desc");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [activeRow, setActiveRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [decision, setDecision] = useState<RegistrationDecision | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [forceRow, setForceRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [similarRow, setSimilarRow] =
        useState<ClientRegistrationListRow | null>(null);
    const [historyRow, setHistoryRow] =
        useState<ClientRegistrationListRow | null>(null);
    const [editRow, setEditRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [retakeBusyId, setRetakeBusyId] = useState<string | null>(null);
    const [retakeLink, setRetakeLink] = useState<{
        personName: string | null;
        phone: string | null;
        url: string;
        message: string;
        expiresAt: string;
    } | null>(null);
    const [pending, startTransition] = useTransition();
    const [showLinks, setShowLinks] = useState(initialShowLinks);

    const listFilters = {
        variant,
        companyClientId,
        page,
        pageSize,
        search: search.trim() || undefined,
        blockId: blockId.trim() || undefined,
        unitId: unitId.trim() || undefined,
        room: room.trim() || undefined,
        status: tab,
    };
    const listQuery = useRegistrationsList(listFilters);
    const rows = listQuery.data?.data;
    const total = listQuery.data?.total ?? 0;
    const resolvedClientType =
        clientTypeProp ?? listQuery.data?.clientType ?? null;

    const refreshList = useCallback(() => {
        void invalidateRegistrationsList(
            queryClient,
            variant,
            companyClientId,
        );
    }, [queryClient, variant, companyClientId]);

    const { runSync } = useRegistrationFaceSync({
        variant,
        companyClientId,
        onAfterSync: refreshList,
    });

    const { syncBusy } = useRegistrationBatchSync({
        variant,
        companyClientId,
        onFinished: refreshList,
    });

    useEffect(() => {
        const data = listQuery.data;
        if (!data || listQuery.isPlaceholderData) return;
        deferInEffect(() => {
            const target = consumeDeepLink(data.data);
            if (target) {
                setShowLinks(false);
                setActiveRow(target);
                setSheetOpen(true);
            } else {
                setActiveRow((prev) => {
                    if (!prev) return prev;
                    return data.data.find((row) => row.id === prev.id) ?? prev;
                });
            }
            const lastPage = totalPages(data.total, pageSize);
            if (data.data.length === 0 && page > lastPage) {
                setPage(lastPage);
            }
        });
    }, [
        listQuery.data,
        listQuery.isPlaceholderData,
        page,
        pageSize,
        consumeDeepLink,
    ]);

    const filtered = useMemo(() => {
        return [...(rows ?? [])].sort((a, b) =>
            compareRegistrationRows(a, b, sortField, sortDir),
        );
    }, [rows, sortField, sortDir]);

    const activeIndex = activeRow
        ? filtered.findIndex((row) => row.id === activeRow.id)
        : -1;

    const toggleSort = useCallback(
        (field: RegistrationSortField) => {
            if (sortField === field) {
                setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
                return;
            }
            setSortField(field);
            setSortDir(field === "submittedAt" ? "desc" : "asc");
        },
        [sortField],
    );

    const resetPage = useCallback((setter: (value: string) => void, value: string) => {
        setter(value);
        setPage(1);
    }, []);

    function openDetail(row: ClientRegistrationListRow) {
        setShowLinks(false);
        setActiveRow(row);
        setSheetOpen(true);
    }

    function commitDecision(
        kind: "approve" | RegistrationDecision,
        notes = "",
    ) {
        if (!activeRow) return;
        const current = activeRow;
        const next =
            filtered[filtered.findIndex((row) => row.id === current.id) + 1] ??
            null;
        startTransition(async () => {
            const res =
                kind === "approve"
                    ? await review.approve(current.id)
                    : kind === "reject"
                      ? await review.reject(current.id, notes)
                      : kind === "block"
                        ? await review.block(current.id, notes)
                        : await review.unblock(current.id, notes);
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success(
                kind === "reject" && current.status === "approved"
                    ? "Cadastro rejeitado. O acesso foi removido dos leitores."
                    : DECISION_SUCCESS[kind],
            );
            setDecision(null);
            refreshList();
            void queryClient.invalidateQueries({
                queryKey: ["registration-events"],
            });
            if (kind === "unblock") {
                setSheetOpen(false);
                setPage(1);
                setTab("approved");
                return;
            }
            if (sheetOpen && next) {
                setActiveRow(next);
                return;
            }
            setSheetOpen(false);
            if (tab === "draft") toast.message("Nenhum cadastro pendente restante.");
        });
    }

    async function runSyncFace(
        row: ClientRegistrationListRow,
        options?: { force?: boolean; allowSimilarFace?: boolean },
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
            queryClient.setQueryData<PaginatedRegistrationsResponse>(
                registrationsListQueryKey(listFilters),
                (prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        data: prev.data.map((item) =>
                            item.id === row.id ? { ...item, ...patch } : item,
                        ),
                    };
                },
            );
            setActiveRow((prev) =>
                prev?.id === row.id ? { ...prev, ...patch } : prev,
            );
        } finally {
            setSyncingId(null);
        }
    }

    async function openRetake(row: ClientRegistrationListRow) {
        setRetakeBusyId(row.id);
        const result = await createFaceRetakeLinkAction(
            variant,
            row.id,
            companyClientId,
        );
        setRetakeBusyId(null);
        if (!result.ok) {
            toast.error(result.error);
            return;
        }
        setRetakeLink({
            personName: row.name,
            phone: row.phone,
            url: result.result.url,
            message: result.result.message,
            expiresAt: result.result.expiresAt,
        });
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
        refreshList();
        void queryClient.invalidateQueries({
            queryKey: ["registration-events"],
        });
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
        refreshList();
        void queryClient.invalidateQueries({
            queryKey: ["registration-events"],
        });
    }

    const catalogClientId =
        variant === "company" ? companyClientId : blocksClientId;
    const catalogQuery = useQuery({
        queryKey: ["client-blocks", catalogClientId],
        enabled:
            Boolean(catalogClientId) && resolvedClientType === "condominium",
        queryFn: async () => {
            const result = await listClientBlocksAction(catalogClientId ?? "");
            if ("error" in result) throw new Error(result.error);
            return result.items;
        },
    });
    const locationBlocks = (catalogQuery.data ?? [])
        .filter((block) => block.isActive)
        .map((block) => ({
            id: block.id,
            name: block.name,
            units: block.units
                .filter((unit) => unit.isActive)
                .map((unit) => ({ id: unit.id, name: unit.name })),
        }));
    const locationType = resolvedClientType;

    const actions = {
        isAdmin,
        busy: pending,
        syncingId,
        retakeBusyId,
        onView: openDetail,
        onHistory: setHistoryRow,
        onSync: (row: ClientRegistrationListRow) => void runSyncFace(row),
        onForceSync: setForceRow,
        onAllowSimilarFace: setSimilarRow,
        onEdit: setEditRow,
        onRetake: (row: ClientRegistrationListRow) => void openRetake(row),
        onReject: (row: ClientRegistrationListRow) => {
            setActiveRow(row);
            setDecision("reject");
        },
        onDelete: runDelete,
        onRestore: runRestore,
    };

    return (
        <div className="space-y-4">
            <RegistrationsToolbar
                tab={tab}
                counts={listQuery.data?.counts}
                onTabChange={(next) => {
                    setShowLinks(false);
                    setTab(next);
                    setPage(1);
                }}
                showLinks={showLinks}
                linksCount={linksCount}
                onShowLinks={
                    linksPanel ? () => setShowLinks(true) : undefined
                }
                search={search}
                onSearchChange={(value) => resetPage(setSearch, value)}
                showBlockUnit={locationType === "condominium"}
                blocks={locationBlocks}
                blockId={blockId}
                onBlockIdChange={(value) => {
                    setBlockId(value);
                    setUnitId("");
                    setPage(1);
                }}
                unitId={unitId}
                onUnitIdChange={(value) => resetPage(setUnitId, value)}
                showRoom={
                    locationType === "office" || locationType === "clinic"
                }
                room={room}
                onRoomChange={(value) => resetPage(setRoom, value)}
                variant={variant}
                companyClientId={companyClientId}
                syncBusy={syncBusy}
            />

            {showLinks && linksPanel ? (
                linksPanel
            ) : (
                <>
                    <RegistrationsMobileList
                        rows={filtered}
                        tab={tab}
                        isFetching={listQuery.isFetching}
                        actions={actions}
                    />
                    <RegistrationsTable
                        rows={filtered}
                        tab={tab}
                        sortField={sortField}
                        sortDir={sortDir}
                        onToggleSort={toggleSort}
                        isFetching={listQuery.isFetching}
                        {...actions}
                    />
                    <DataTablePagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={setPage}
                        onPageSizeChange={(next) => {
                            setPageSize(next);
                            setPage(1);
                        }}
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        disabled={listQuery.isFetching || pending}
                    />
                </>
            )}

            <RegistrationDetailSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                row={activeRow}
                index={activeIndex}
                total={filtered.length}
                variant={variant}
                companyClientId={companyClientId}
                pending={pending}
                syncing={syncingId === activeRow?.id}
                retakeBusy={retakeBusyId === activeRow?.id}
                onPrev={() => {
                    const prev = filtered[activeIndex - 1];
                    if (prev) setActiveRow(prev);
                }}
                onNext={() => {
                    const next = filtered[activeIndex + 1];
                    if (next) setActiveRow(next);
                }}
                onApprove={() => commitDecision("approve")}
                onReject={() => setDecision("reject")}
                onBlock={() => setDecision("block")}
                onUnblock={() => setDecision("unblock")}
                onHistory={() => {
                    if (activeRow) setHistoryRow(activeRow);
                }}
                onEdit={() => {
                    if (activeRow) setEditRow(activeRow);
                }}
                onRetake={() => {
                    if (activeRow) void openRetake(activeRow);
                }}
                onSync={() => {
                    if (activeRow) void runSyncFace(activeRow);
                }}
                onForceSync={() => {
                    if (activeRow) setForceRow(activeRow);
                }}
            />

            <RegistrationDecisionDialog
                key={decision ?? "closed"}
                open={decision != null}
                kind={decision}
                personName={activeRow?.name ?? null}
                wasApproved={activeRow?.status === "approved"}
                pending={pending}
                onOpenChange={(open) => {
                    if (!open) setDecision(null);
                }}
                onConfirm={(notes) => {
                    if (decision) commitDecision(decision, notes);
                }}
            />

            <FaceRetakeLinkDialog
                open={retakeLink != null}
                onOpenChange={(open) => {
                    if (!open) setRetakeLink(null);
                }}
                personName={retakeLink?.personName ?? null}
                phone={retakeLink?.phone ?? null}
                url={retakeLink?.url ?? ""}
                message={retakeLink?.message ?? ""}
                expiresAt={retakeLink?.expiresAt ?? ""}
            />

            <RegistrationEditSheet
                open={editRow != null}
                onOpenChange={(open) => {
                    if (!open) setEditRow(null);
                }}
                row={editRow}
                clientType={resolvedClientType}
                variant={variant}
                companyClientId={companyClientId}
                onSuccess={refreshList}
            />

            <RegistrationTimelineSheet
                open={historyRow != null}
                onOpenChange={(open) => {
                    if (!open) setHistoryRow(null);
                }}
                row={historyRow}
                variant={variant}
                companyClientId={companyClientId}
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
                            onClick={(event) => {
                                event.preventDefault();
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

            <AllowSimilarFaceDialog
                open={similarRow != null}
                onOpenChange={(open) => {
                    if (!open) setSimilarRow(null);
                }}
                personName={similarRow?.name ?? "este cadastro"}
                error={similarRow?.deviceSyncError}
                busy={pending}
                onConfirm={() => {
                    if (!similarRow) return;
                    const row = similarRow;
                    setSimilarRow(null);
                    void runSyncFace(row, { allowSimilarFace: true });
                }}
            />
        </div>
    );
}
