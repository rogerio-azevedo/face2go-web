"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { listMembersAction } from "@/app/company/clientes/[clientId]/usuarios/members-actions";
import { useFaceSyncOffer } from "@/lib/use-face-sync-offer";
import type { ClientRoleRow, MemberRow, PaginatedResponse } from "@/types/domain";
import { deferInEffect } from "@/lib/defer-in-effect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { FaceCirclePhoto } from "@/components/ui/face-circle-photo";
import { SearchInput } from "@/components/ui/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { DeviceSyncStatusBadge } from "./DeviceSyncStatusBadge";
import { FaceSyncOfferModal } from "./FaceSyncOfferModal";
import { FaceSyncResultModal } from "./FaceSyncResultModal";
import { MemberEditSheet } from "./MemberEditSheet";
import { MemberForm } from "./MemberForm";

export function MembersSection({
    clientId,
    isAdmin = false,
    roles,
    initialMembers,
}: {
    clientId: string;
    isAdmin?: boolean;
    roles: ClientRoleRow[];
    initialMembers: PaginatedResponse<MemberRow>;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [list, setList] = useState(initialMembers);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(initialMembers.page);
    const [loading, setLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editRow, setEditRow] = useState<MemberRow | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const faceSyncOffer = useFaceSyncOffer({
        clientId,
        kind: "member",
        onAfterSync: () => refresh(),
    });

    const fetchList = useCallback(
        async (nextPage: number, nextSearch: string) => {
            setLoading(true);
            try {
                const r = await listMembersAction(clientId, {
                    page: nextPage,
                    pageSize: list.pageSize,
                    search: nextSearch || undefined,
                });
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
                setList(r.result);
            } finally {
                setLoading(false);
            }
        },
        [clientId, list.pageSize],
    );

    useEffect(() => {
        deferInEffect(() => {
            setList(initialMembers);
            setPage(initialMembers.page);
        });
    }, [initialMembers]);

    useEffect(() => {
        deferInEffect(() => {
            void fetchList(page, search);
        });
    }, [page, search, fetchList]);

    function refresh() {
        startTransition(() => router.refresh());
        void fetchList(page, search);
    }

    function onSearchChange(value: string) {
        setSearch(value);
        setPage(1);
    }

    async function handleSync(row: MemberRow) {
        setSyncingId(row.id);
        try {
            await faceSyncOffer.runSync(row.id, row.name);
        } finally {
            setSyncingId(null);
        }
    }

    function handleSyncModalClose() {
        faceSyncOffer.closeSyncResult();
    }

    const tableBusy = loading || isPending;

    return (
        <>
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <SearchInput
                    id="search-members"
                    value={search}
                    onValueChange={onSearchChange}
                    placeholder="Buscar por nome ou CPF…"
                    disabled={tableBusy}
                    className="sm:max-w-sm"
                />
                <Button
                    type="button"
                    size="default"
                    className="self-end shrink-0"
                    onClick={() => setCreateOpen(true)}
                    disabled={roles.length === 0}
                >
                    Novo membro
                </Button>
            </div>

            <div className="relative rounded-md border">
                {tableBusy ? (
                    <div
                        className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-md"
                        aria-hidden
                    >
                        <Loader2 className="text-muted-foreground size-6 animate-spin" />
                    </div>
                ) : null}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[52px]" aria-label="Foto" />
                            <TableHead>Nome</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Acesso login</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Leitor</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    {search
                                        ? "Nenhum membro encontrado."
                                        : "Nenhum membro cadastrado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            list.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="align-middle">
                                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                                            <FaceCirclePhoto
                                                className="size-full"
                                                photoUrl={row.photoUrl ?? null}
                                                nameHint={row.name}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {row.roleName}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{row.phone ?? "—"}</TableCell>
                                    <TableCell>{row.document ?? "—"}</TableCell>
                                    <TableCell>
                                        {row.userId ? (
                                            <Badge>Sim</Badge>
                                        ) : (
                                            <Badge variant="secondary">—</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.isActive ? (
                                            <Badge>Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inativo
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DeviceSyncStatusBadge
                                            status={row.deviceSyncStatus}
                                            hasFace={row.faceId != null}
                                            error={row.deviceSyncError}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    row.faceId == null ||
                                                    syncingId === row.id ||
                                                    tableBusy
                                                }
                                                title={
                                                    row.faceId == null
                                                        ? "Cadastre uma foto antes de sincronizar"
                                                        : "Sincronizar face com os leitores"
                                                }
                                                onClick={() => void handleSync(row)}
                                            >
                                                {syncingId === row.id ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="size-4" />
                                                )}
                                                <span className="sr-only sm:not-sr-only sm:ml-1.5">
                                                    Sincronizar
                                                </span>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditRow(row);
                                                    setEditOpen(true);
                                                }}
                                            >
                                                Editar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                page={list.page}
                pageSize={list.pageSize}
                total={list.total}
                disabled={tableBusy}
                onPageChange={setPage}
            />

            <MemberForm
                open={createOpen}
                onOpenChange={setCreateOpen}
                clientId={clientId}
                roles={roles}
                onSuccess={() => {
                    toast.success("Membro cadastrado.");
                    refresh();
                }}
            />

            <MemberEditSheet
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) setEditRow(null);
                }}
                clientId={clientId}
                isAdmin={isAdmin}
                member={editRow}
                roles={roles}
                onSuccess={() => {
                    toast.success("Membro atualizado.");
                    refresh();
                }}
                onDeleted={() => {
                    toast.success("Membro excluído.");
                    refresh();
                }}
            />

            <FaceSyncOfferModal
                open={faceSyncOffer.offerTarget != null}
                personName={faceSyncOffer.offerTarget?.name ?? ""}
                onConfirm={() => void faceSyncOffer.confirmOffer()}
                onDismiss={faceSyncOffer.dismissOffer}
            />

            <FaceSyncResultModal
                state={faceSyncOffer.syncModalState}
                onClose={handleSyncModalClose}
            />
        </>
    );
}
