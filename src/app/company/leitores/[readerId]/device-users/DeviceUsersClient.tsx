"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
    batchDeleteDeviceUsersAction,
    getDeviceUsersAction,
    getDeviceUserFaceAction,
    removeDeviceUserAction,
    wipeAllDeviceUsersAction,
    type DeviceUser,
} from "@/app/company/leitores/actions";
import {
    DeviceUserFaceSheet,
    DeviceUsersConfirmDialogs,
} from "@/features/readers/components/DeviceUsersDialogs";
import { DeviceUsersSyncAllModal } from "@/features/readers/components/DeviceUsersSyncAllModal";
import { DeviceUsersTable } from "@/features/readers/components/DeviceUsersTable";
import {
    DeviceUsersToolbar,
    type DeviceUsersOriginFilter,
} from "@/features/readers/components/DeviceUsersToolbar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { deferInEffect } from "@/lib/defer-in-effect";

const LIMIT = 50;

function totalForPagination(
    result: { totalCount: number; found: number; records: DeviceUser[] },
    offset: number,
): number {
    if (result.totalCount > 0) return result.totalCount;
    return Math.max(result.found, offset + result.records.length);
}

export default function DeviceUsersClient({
    readerId,
    readerName,
}: {
    readerId: string;
    readerName?: string;
}) {
    const router = useRouter();
    const [users, setUsers] = useState<DeviceUser[]>([]);
    const [totalFound, setTotalFound] = useState(0);
    const [offset, setOffset] = useState(0);
    const [search, setSearch] = useState("");
    const [originFilter, setOriginFilter] =
        useState<DeviceUsersOriginFilter>("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingFace, setIsFetchingFace] = useState(false);
    const [selectedUserPhoto, setSelectedUserPhoto] = useState<string | null>(null);
    const [selectedUserName, setSelectedUserName] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [confirmSelectedOpen, setConfirmSelectedOpen] = useState(false);
    const [confirmWipeOpen, setConfirmWipeOpen] = useState(false);
    const [syncOpen, setSyncOpen] = useState(false);
    const [clientType, setClientType] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const showRebuild = clientType != null && clientType !== "school";

    const visibleUsers = useMemo(() => {
        if (originFilter === "system") return users.filter((u) => u.inSystem);
        if (originFilter === "orphan") return users.filter((u) => !u.inSystem);
        return users;
    }, [users, originFilter]);

    const fetchUsers = useCallback(
        async (currentOffset: number, searchTerm: string) => {
            setIsLoading(true);
            const res = await getDeviceUsersAction(
                readerId,
                LIMIT,
                currentOffset,
                searchTerm.trim() || undefined,
            );
            if (res.ok) {
                setUsers(res.data.records);
                setTotalFound(totalForPagination(res.data, currentOffset));
                if (res.data.clientType) setClientType(res.data.clientType);
            } else {
                toast.error(res.error || "Erro ao carregar usuários.");
                setUsers([]);
                setTotalFound(0);
            }
            setSelectedIds(new Set());
            setIsLoading(false);
        },
        [readerId],
    );

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setOffset(0);
    }, []);

    useEffect(() => {
        deferInEffect(() => {
            void fetchUsers(offset, search);
        });
    }, [offset, search, fetchUsers]);

    const handleDelete = (userId: string) => {
        if (
            !confirm(
                "Tem certeza que deseja remover este usuário DIRETAMENTE do leitor facial? Essa ação não apaga o cadastro do sistema, apenas do equipamento.",
            )
        ) {
            return;
        }

        startTransition(async () => {
            const res = await removeDeviceUserAction(readerId, userId);
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Usuário removido do leitor.");
            void fetchUsers(offset, search);
        });
    };

    const handleViewFace = async (userId: string, cardName: string) => {
        setIsFetchingFace(true);
        setSelectedUserName(cardName);
        const res = await getDeviceUserFaceAction(readerId, userId);
        setIsFetchingFace(false);

        if (res.ok) {
            if (res.data.photoBase64) {
                setSelectedUserPhoto(res.data.photoBase64);
                setIsSheetOpen(true);
            } else {
                toast.error("Nenhuma foto encontrada para este usuário no leitor.");
            }
        } else {
            toast.error(res.error || "Erro ao buscar foto.");
        }
    };

    const handleBatchDelete = () => {
        const ids = [...selectedIds];
        startTransition(async () => {
            const res = await batchDeleteDeviceUsersAction(readerId, ids);
            setConfirmSelectedOpen(false);
            if (!res.ok) {
                toast.error(res.error);
                return;
            }
            toast.success(`${res.data.deleted.length} usuário(s) removido(s) do leitor.`);
            if (res.data.failed.length > 0) {
                toast.error(`Falha em ${res.data.failed.length} usuário(s).`);
            }
            void fetchUsers(offset, search);
        });
    };

    const handleWipeAll = () => {
        startTransition(async () => {
            const res = await wipeAllDeviceUsersAction(readerId);
            setConfirmWipeOpen(false);
            if (!res.ok) {
                toast.error(res.error);
                return;
            }
            const extra =
                res.data.failed.length > 0
                    ? ` Falha em ${res.data.failed.length} usuário(s).`
                    : "";
            toast.success(
                res.data.strategy === "hikvision-all"
                    ? `Todos os usuários foram apagados neste leitor.${extra}`
                    : `${res.data.deleted} usuário(s) apagado(s) neste leitor.${extra}`,
            );
            void fetchUsers(offset, search);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title={
                        readerName
                            ? `Usuários — ${readerName}`
                            : "Usuários no Dispositivo"
                    }
                    description="Listagem de usuários atualmente salvos na memória do leitor facial."
                />
                <Button variant="outline" onClick={() => router.back()}>
                    Voltar
                </Button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground">
                <DeviceUsersToolbar
                    search={search}
                    onSearchChange={handleSearchChange}
                    originFilter={originFilter}
                    onOriginFilterChange={setOriginFilter}
                    selectedCount={selectedIds.size}
                    pending={pending}
                    showRebuild={showRebuild}
                    onRemoveSelected={() => setConfirmSelectedOpen(true)}
                    onWipeAll={() => setConfirmWipeOpen(true)}
                    onSyncAll={() => setSyncOpen(true)}
                />
                <DeviceUsersTable
                    users={visibleUsers}
                    isLoading={isLoading}
                    pending={pending}
                    isFetchingFace={isFetchingFace}
                    selectedIds={selectedIds}
                    onToggle={(userId, checked) => {
                        setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(userId);
                            else next.delete(userId);
                            return next;
                        });
                    }}
                    onToggleAll={(checked) => {
                        setSelectedIds((prev) => {
                            const next = new Set(prev);
                            for (const row of visibleUsers) {
                                if (checked) next.add(row.UserID);
                                else next.delete(row.UserID);
                            }
                            return next;
                        });
                    }}
                    onViewFace={handleViewFace}
                    onDelete={handleDelete}
                />

                <div className="flex items-center justify-between border-t px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                        {totalFound > 0 ? (
                            <span>
                                Mostrando {offset + 1} a {Math.min(offset + LIMIT, totalFound)} de{" "}
                                {totalFound} usuários
                            </span>
                        ) : (
                            <span>Total: 0</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOffset((prev) => prev - LIMIT)}
                            disabled={offset === 0 || isLoading}
                        >
                            <ChevronLeft className="mr-1 size-4" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOffset((prev) => prev + LIMIT)}
                            disabled={offset + LIMIT >= totalFound || isLoading}
                        >
                            Próxima
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <DeviceUsersConfirmDialogs
                selectedCount={selectedIds.size}
                confirmSelectedOpen={confirmSelectedOpen}
                onConfirmSelectedOpenChange={setConfirmSelectedOpen}
                onConfirmSelected={handleBatchDelete}
                confirmWipeOpen={confirmWipeOpen}
                onConfirmWipeOpenChange={setConfirmWipeOpen}
                onConfirmWipe={handleWipeAll}
                pending={pending}
            />

            <DeviceUsersSyncAllModal
                readerId={readerId}
                open={syncOpen}
                onOpenChange={setSyncOpen}
                onFinished={() => {
                    void fetchUsers(offset, search);
                }}
            />

            <DeviceUserFaceSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                name={selectedUserName}
                photoBase64={selectedUserPhoto}
            />
        </div>
    );
}
