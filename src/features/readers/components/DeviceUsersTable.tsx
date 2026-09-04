"use client";

import { Eye, Trash2 } from "lucide-react";

import type { DeviceUser } from "@/app/company/leitores/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const PERSON_TYPE_LABEL: Record<NonNullable<DeviceUser["personType"]>, string> = {
    responsible: "Responsável",
    student: "Aluno",
    member: "Membro",
    guest: "Convidado",
};

function InSystemCell({ user }: { user: DeviceUser }) {
    if (!user.inSystem) {
        return (
            <div className="flex flex-col gap-0.5">
                <Badge variant="outline">Não</Badge>
            </div>
        );
    }

    return (
        <div className="flex max-w-55 flex-col gap-0.5">
            <Badge>Sim</Badge>
            {user.systemName ? (
                <span className="text-xs text-muted-foreground">
                    {user.systemName}
                    {user.personType
                        ? ` · ${PERSON_TYPE_LABEL[user.personType]}`
                        : ""}
                </span>
            ) : null}
            {user.nameMismatch ? (
                <span className="text-xs text-destructive">
                    Nome no leitor diverge do cadastro
                </span>
            ) : null}
        </div>
    );
}

export function DeviceUsersTable({
    users,
    isLoading,
    pending,
    isFetchingFace,
    selectedIds,
    onToggle,
    onToggleAll,
    onViewFace,
    onDelete,
}: {
    users: DeviceUser[];
    isLoading: boolean;
    pending: boolean;
    isFetchingFace: boolean;
    selectedIds: Set<string>;
    onToggle: (userId: string, checked: boolean) => void;
    onToggleAll: (checked: boolean) => void;
    onViewFace: (userId: string, cardName: string) => void;
    onDelete: (userId: string) => void;
}) {
    const allSelected =
        users.length > 0 && users.every((u) => selectedIds.has(u.UserID));

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-10">
                        <Checkbox
                            checked={allSelected}
                            disabled={isLoading || users.length === 0}
                            onCheckedChange={(value) => onToggleAll(value === true)}
                            aria-label="Selecionar todos da página"
                        />
                    </TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>No sistema</TableHead>
                    <TableHead>Nº Cartão</TableHead>
                    <TableHead>Face</TableHead>
                    <TableHead>Validade Início</TableHead>
                    <TableHead>Validade Fim</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                            Consultando leitor...
                        </TableCell>
                    </TableRow>
                ) : users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                            Nenhum usuário encontrado na memória.
                        </TableCell>
                    </TableRow>
                ) : (
                    users.map((u, i) => (
                        <TableRow key={`${u.UserID}-${i}`}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedIds.has(u.UserID)}
                                    onCheckedChange={(value) =>
                                        onToggle(u.UserID, value === true)
                                    }
                                    aria-label={`Selecionar ${u.CardName || u.UserID}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">{u.UserID}</TableCell>
                            <TableCell>{u.CardName}</TableCell>
                            <TableCell>
                                <InSystemCell user={u} />
                            </TableCell>
                            <TableCell>{u.CardNo || "—"}</TableCell>
                            <TableCell>
                                {u.HasFace === true ? (
                                    <span className="text-xs font-medium text-emerald-700">
                                        Sim
                                    </span>
                                ) : u.HasFace === false ? (
                                    <span className="text-xs text-muted-foreground">Não</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell>{u.ValidDateStart || "—"}</TableCell>
                            <TableCell>{u.ValidDateEnd || "—"}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                        disabled={pending || isFetchingFace}
                                        onClick={() => onViewFace(u.UserID, u.CardName)}
                                        title="Ver foto no leitor"
                                    >
                                        <Eye className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                        disabled={pending}
                                        onClick={() => onDelete(u.UserID)}
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
    );
}
