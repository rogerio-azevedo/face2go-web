"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
    setClientSystemUserPasswordAction,
    toggleClientSystemUserActiveAction,
    updateClientSystemUserProfileAction,
    updateClientSystemUserRoleAction,
    type ClientSystemUserRow,
} from "@/app/company/clientes/[clientId]/usuarios/client-system-actions";
import {
    setClientSelfSystemUserPasswordAction,
    toggleClientSelfSystemUserActiveAction,
    updateClientSelfSystemUserProfileAction,
    updateClientSelfSystemUserRoleAction,
} from "@/app/client/equipe/actions";
import { ClientSystemUserEditSheet } from "@/components/shared/ClientSystemUserEditSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export type { ClientSystemUserRow };

const roleLabels: Record<ClientSystemUserRow["role"], string> = {
    client_admin: "Administrador",
    client_operator: "Operador",
};

type ClientSystemUsersTableProps = {
    users: ClientSystemUserRow[];
    currentUserId?: string;
    variant: "company" | "client";
    clientId?: string;
    onChanged?: () => void;
};

export function ClientSystemUsersTable({
    users,
    currentUserId,
    variant,
    clientId,
    onChanged,
}: ClientSystemUsersTableProps) {
    const router = useRouter();
    const [editRow, setEditRow] = useState<ClientSystemUserRow | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [pending, startTransition] = useTransition();

    function openEdit(row: ClientSystemUserRow) {
        setEditRow(row);
        setEditName(row.name ?? "");
        setEditEmail(row.email);
        setEditPassword("");
    }

    function saveEdit() {
        if (!editRow) return;
        const name = editName.trim();
        const email = editEmail.trim().toLowerCase();
        const password = editPassword.trim();
        if (name.length < 2) {
            toast.error("Informe o nome completo.");
            return;
        }
        if (!email.includes("@")) {
            toast.error("Informe um e-mail válido.");
            return;
        }
        if (password && password.length < 6) {
            toast.error("Senha deve ter pelo menos 6 caracteres.");
            return;
        }

        startTransition(async () => {
            const profileResult =
                variant === "company"
                    ? await updateClientSystemUserProfileAction({
                          clientId,
                          clientUserId: editRow.clientUserId,
                          name,
                          email,
                      })
                    : await updateClientSelfSystemUserProfileAction({
                          clientUserId: editRow.clientUserId,
                          name,
                          email,
                      });
            if ("error" in profileResult) {
                toast.error(profileResult.error);
                return;
            }

            if (password) {
                const passwordResult =
                    variant === "company"
                        ? await setClientSystemUserPasswordAction({
                              clientId,
                              clientUserId: editRow.clientUserId,
                              password,
                          })
                        : await setClientSelfSystemUserPasswordAction({
                              clientUserId: editRow.clientUserId,
                              password,
                          });
                if ("error" in passwordResult) {
                    toast.error(passwordResult.error);
                    return;
                }
            }

            toast.success("Dados atualizados.");
            setEditRow(null);
            setEditPassword("");
            onChanged?.();
            router.refresh();
        });
    }

    function changeRole(
        clientUserId: string,
        role: ClientSystemUserRow["role"],
    ) {
        startTransition(async () => {
            const result =
                variant === "company"
                    ? await updateClientSystemUserRoleAction({
                          clientId,
                          clientUserId,
                          role,
                      })
                    : await updateClientSelfSystemUserRoleAction({
                          clientUserId,
                          role,
                      });
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Papel atualizado.");
                onChanged?.();
                router.refresh();
            }
        });
    }

    function toggleActive(clientUserId: string, isActive: boolean) {
        startTransition(async () => {
            const result =
                variant === "company"
                    ? await toggleClientSystemUserActiveAction({
                          clientId,
                          clientUserId,
                          isActive,
                      })
                    : await toggleClientSelfSystemUserActiveAction({
                          clientUserId,
                          isActive,
                      });
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(
                    isActive ? "Usuário reativado." : "Usuário desativado.",
                );
                onChanged?.();
                router.refresh();
            }
        });
    }

    if (users.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Nenhum usuário do sistema vinculado ainda.
            </p>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((row) => {
                            const isSelf = row.userId === currentUserId;
                            return (
                                <TableRow key={row.clientUserId}>
                                    <TableCell className="font-medium">
                                        {row.name ?? "—"}
                                    </TableCell>
                                    <TableCell>{row.email}</TableCell>
                                    <TableCell>
                                        <select
                                            className="border-input bg-background rounded-md border px-2 py-1 text-sm"
                                            value={row.role}
                                            disabled={isSelf || pending}
                                            onChange={(e) =>
                                                changeRole(
                                                    row.clientUserId,
                                                    e.target
                                                        .value as ClientSystemUserRow["role"],
                                                )
                                            }
                                        >
                                            <option value="client_admin">
                                                {roleLabels.client_admin}
                                            </option>
                                            <option value="client_operator">
                                                {roleLabels.client_operator}
                                            </option>
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={row.isActive}
                                                disabled={isSelf || pending}
                                                onCheckedChange={(v) =>
                                                    toggleActive(
                                                        row.clientUserId,
                                                        v === true,
                                                    )
                                                }
                                            />
                                            {row.isActive ? (
                                                <Badge>Ativo</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Inativo
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEdit(row)}
                                            disabled={pending}
                                        >
                                            Editar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <ClientSystemUserEditSheet
                open={!!editRow}
                name={editName}
                email={editEmail}
                password={editPassword}
                pending={pending}
                onNameChange={setEditName}
                onEmailChange={setEditEmail}
                onPasswordChange={setEditPassword}
                onClose={() => setEditRow(null)}
                onSave={saveEdit}
            />
        </>
    );
}
