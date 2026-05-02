"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
    toggleCompanyMemberActiveAction,
    updateCompanyMemberProfileAction,
    updateCompanyMemberRoleAction,
} from "@/app/company/usuarios/actions";
import type { CompanyUserListRow } from "@/db/queries/users";
import { UserPermissionsDialog } from "@/components/company/usuarios/UserPermissionsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const roleLabels: Record<string, string> = {
    company_admin: "Administrador",
    company_operator: "Operador",
};

export type PermissionsMap = Record<
    string,
    { featureSlug: string; actions: string[] }[]
>;

export function CompanyUsersTable({
    users,
    currentUserId,
    permissionsMap,
}: {
    users: CompanyUserListRow[];
    currentUserId: string;
    permissionsMap: PermissionsMap;
}) {
    const router = useRouter();
    const [permUserId, setPermUserId] = useState<string | null>(null);
    const [editRow, setEditRow] = useState<CompanyUserListRow | null>(null);
    const [editName, setEditName] = useState("");
    const [editJob, setEditJob] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [pending, startTransition] = useTransition();

    const permRows =
        permUserId && permissionsMap[permUserId]
            ? permissionsMap[permUserId]!
            : [];

    function openEdit(row: CompanyUserListRow) {
        setEditRow(row);
        setEditName(row.name ?? "");
        setEditJob(row.jobTitle ?? "");
        setEditPhone(row.phone ?? "");
    }

    function saveEdit() {
        if (!editRow) return;
        startTransition(async () => {
            const result = await updateCompanyMemberProfileAction({
                companyUserId: editRow.companyUserId,
                name: editName.trim(),
                jobTitle: editJob.trim() || null,
                phone: editPhone.trim() || null,
            });
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Dados atualizados.");
                setEditRow(null);
                router.refresh();
            }
        });
    }

    function changeRole(companyUserId: string, role: string) {
        if (role !== "company_admin" && role !== "company_operator") return;
        startTransition(async () => {
            const result = await updateCompanyMemberRoleAction({
                companyUserId,
                role,
            });
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success("Papel atualizado.");
                router.refresh();
            }
        });
    }

    function toggleActive(companyUserId: string, isActive: boolean) {
        startTransition(async () => {
            const result = await toggleCompanyMemberActiveAction({
                companyUserId,
                isActive,
            });
            if ("error" in result) {
                toast.error(result.error);
            } else {
                toast.success(isActive ? "Usuário reativado." : "Usuário desativado.");
                router.refresh();
            }
        });
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((row) => {
                            const isSelf = row.userId === currentUserId;
                            return (
                                <TableRow key={row.companyUserId}>
                                    <TableCell className="font-medium">
                                        {row.name ?? "—"}
                                    </TableCell>
                                    <TableCell>{row.email}</TableCell>
                                    <TableCell>{row.jobTitle ?? "—"}</TableCell>
                                    <TableCell>{row.phone ?? "—"}</TableCell>
                                    <TableCell>
                                        <select
                                            className="border-input bg-background rounded-md border px-2 py-1 text-sm"
                                            value={row.role}
                                            disabled={isSelf || pending}
                                            onChange={(e) =>
                                                changeRole(
                                                    row.companyUserId,
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="company_admin">
                                                {roleLabels.company_admin}
                                            </option>
                                            <option value="company_operator">
                                                {roleLabels.company_operator}
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
                                                        row.companyUserId,
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
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEdit(row)}
                                            disabled={pending}
                                        >
                                            Editar
                                        </Button>
                                        {row.role === "company_operator" ? (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    setPermUserId(row.companyUserId)
                                                }
                                                disabled={pending}
                                            >
                                                Permissões
                                            </Button>
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <UserPermissionsDialog
                open={!!permUserId}
                onOpenChange={(v) => !v && setPermUserId(null)}
                companyUserId={permUserId ?? ""}
                initialRows={permRows}
            />

            <Sheet
                open={!!editRow}
                onOpenChange={(v) => !v && setEditRow(null)}
            >
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Editar colaborador</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="editName">Nome</Label>
                            <Input
                                id="editName"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editJob">Cargo</Label>
                            <Input
                                id="editJob"
                                value={editJob}
                                onChange={(e) => setEditJob(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editPhone">Telefone</Label>
                            <Input
                                id="editPhone"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <SheetFooter className="flex-row justify-end gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setEditRow(null)}
                            disabled={pending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={saveEdit}
                            disabled={pending}
                        >
                            {pending ? "Salvando..." : "Salvar"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
