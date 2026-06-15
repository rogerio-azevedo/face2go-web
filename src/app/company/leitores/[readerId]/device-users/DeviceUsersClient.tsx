"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";

import {
    getDeviceUsersAction,
    getDeviceUserFaceAction,
    removeDeviceUserAction,
    type DeviceUser,
} from "@/app/company/leitores/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deferInEffect } from "@/lib/defer-in-effect";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

const LIMIT = 50;

function totalForPagination(
    result: { totalCount: number; found: number; records: DeviceUser[] },
    offset: number,
): number {
    if (result.totalCount > 0) return result.totalCount;
    return Math.max(result.found, offset + result.records.length);
}

export default function DeviceUsersClient({ readerId }: { readerId: string }) {
    const router = useRouter();
    const [users, setUsers] = useState<DeviceUser[]>([]);
    const [totalFound, setTotalFound] = useState(0);
    const [offset, setOffset] = useState(0);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingFace, setIsFetchingFace] = useState(false);
    const [selectedUserPhoto, setSelectedUserPhoto] = useState<string | null>(null);
    const [selectedUserName, setSelectedUserName] = useState<string>("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [pending, startTransition] = useTransition();

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
            } else {
                toast.error(res.error || "Erro ao carregar usuários.");
                setUsers([]);
                setTotalFound(0);
            }
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

    const handleNext = () => {
        if (offset + LIMIT < totalFound) {
            setOffset((prev) => prev + LIMIT);
        }
    };

    const handlePrev = () => {
        if (offset - LIMIT >= 0) {
            setOffset((prev) => prev - LIMIT);
        }
    };

    const handleDelete = (userId: string) => {
        if (!confirm("Tem certeza que deseja remover este usuário DIRETAMENTE do leitor facial? Essa ação não apaga o cadastro do sistema, apenas do equipamento.")) {
            return;
        }

        startTransition(async () => {
            const res = await removeDeviceUserAction(readerId, userId);
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Usuário removido do leitor.");
            // Recarrega a página atual
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Usuários no Dispositivo"
                    description="Listagem de usuários atualmente salvos na memória do leitor facial."
                />
                <Button variant="outline" onClick={() => router.back()}>
                    Voltar
                </Button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground">
                <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <SearchInput
                        value={search}
                        onValueChange={handleSearchChange}
                        placeholder="Buscar por nome..."
                        disabled={isLoading}
                        className="sm:max-w-xs"
                    />
                    {search.trim() ? (
                        <p className="text-sm text-muted-foreground">
                            Filtrando por &quot;{search.trim()}&quot;
                        </p>
                    ) : null}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Nome (CardName)</TableHead>
                            <TableHead>Nº Cartão</TableHead>
                            <TableHead>Validade Início</TableHead>
                            <TableHead>Validade Fim</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    Consultando leitor...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                    Nenhum usuário encontrado na memória.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((u, i) => (
                                <TableRow key={`${u.UserID}-${i}`}>
                                    <TableCell className="font-medium">{u.UserID}</TableCell>
                                    <TableCell>{u.CardName}</TableCell>
                                    <TableCell>{u.CardNo || "—"}</TableCell>
                                    <TableCell>{u.ValidDateStart || "—"}</TableCell>
                                    <TableCell>{u.ValidDateEnd || "—"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                disabled={pending || isFetchingFace}
                                                onClick={() => handleViewFace(u.UserID, u.CardName)}
                                                title="Ver foto no leitor"
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                disabled={pending}
                                                onClick={() => handleDelete(u.UserID)}
                                                title="Excluir do dispositivo"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                        {totalFound > 0 ? (
                            <span>
                                Mostrando {offset + 1} a {Math.min(offset + LIMIT, totalFound)} de {totalFound} usuários
                            </span>
                        ) : (
                            <span>Total: 0</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            disabled={offset === 0 || isLoading}
                        >
                            <ChevronLeft className="size-4 mr-1" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={offset + LIMIT >= totalFound || isLoading}
                        >
                            Próxima
                            <ChevronRight className="size-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Foto no Dispositivo</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col items-center justify-center gap-6 py-10">
                        <div className="text-center">
                            <p className="text-sm font-medium">{selectedUserName}</p>
                            <p className="text-xs text-muted-foreground">Extraída diretamente da memória do leitor</p>
                        </div>
                        {selectedUserPhoto ? (
                            <div className="overflow-hidden rounded-xl border bg-muted shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`data:image/jpeg;base64,${selectedUserPhoto}`}
                                    alt="Foto do usuário"
                                    className="max-h-[400px] w-auto object-contain"
                                />
                            </div>
                        ) : null}
                        <Button variant="outline" className="w-full" onClick={() => setIsSheetOpen(false)}>
                            Fechar
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
