"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch, Controller } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
    deleteMemberAction,
    updateMemberAction,
} from "@/app/company/clientes/[clientId]/usuarios/members-actions";
import type { ClientRoleRow, MemberRow } from "@/types/domain";
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
import { updateMemberSchemaForEdit } from "@/lib/validations/members";
import {
    applyCpfMaskInput,
    CPF_FORMATTED_MAX_LENGTH,
    formatCpf,
    normalizeCpf,
} from "@/lib/utils/document";

type EditVals = z.infer<ReturnType<typeof updateMemberSchemaForEdit>>;

export function MemberEditSheet({
    open,
    onOpenChange,
    clientId,
    isAdmin = false,
    member,
    roles,
    onSuccess,
    onDeleted,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    isAdmin?: boolean;
    member: MemberRow | null;
    roles: ClientRoleRow[];
    onSuccess?: () => void;
    onDeleted?: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const hasAccount = Boolean(member?.userId);

    const editSchema = useMemo(
        () => updateMemberSchemaForEdit(hasAccount),
        [hasAccount],
    );

    const editFormDefaults = useMemo((): EditVals => {
        if (!member) {
            return {
                roleId: roles[0]?.id,
                name: "",
                email: "",
                phone: "",
                document: "",
                password: "",
                isActive: true,
                canEnrollStudentFace: false,
            };
        }
        return {
            roleId: member.roleId,
            name: member.name,
            email: member.email ?? "",
            phone: member.phone ?? "",
            document: member.document ? formatCpf(member.document) : "",
            password: "",
            isActive: member.isActive,
            canEnrollStudentFace: member.canEnrollStudentFace,
        };
    }, [member, roles]);

    const editForm = useForm<EditVals>({
        resolver: zodResolver(editSchema) as Resolver<EditVals>,
        defaultValues: editFormDefaults,
    });

    const editIsActiveToggle = useWatch({
        control: editForm.control,
        name: "isActive",
        defaultValue:
            typeof editFormDefaults.isActive === "boolean"
                ? editFormDefaults.isActive
                : true,
    });
    const editCanEnrollStudentFaceToggle = useWatch({
        control: editForm.control,
        name: "canEnrollStudentFace",
        defaultValue: editFormDefaults.canEnrollStudentFace === true,
    });

    useEffect(() => {
        if (!open || !member) return;
        editForm.reset(editFormDefaults);
    }, [open, member, editForm, editFormDefaults, editSchema]);

    async function confirmDelete() {
        if (!member) return;
        setDeleting(true);
        try {
            const r = await deleteMemberAction(clientId, member.id);
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            setDeleteOpen(false);
            onOpenChange(false);
            onDeleted?.();
        } finally {
            setDeleting(false);
        }
    }

    async function submitEdit(vals: EditVals) {
        setBusy(true);
        try {
            if (!member) return;
            const body = {
                ...vals,
                document: vals.document ? normalizeCpf(vals.document) : vals.document,
                canEnrollStudentFace: editCanEnrollStudentFaceToggle === true,
            };
            if (body.password === "" || body.password === undefined) {
                delete body.password;
            }
            const r = await updateMemberAction(clientId, member.id, body);
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            onOpenChange(false);
            onSuccess?.();
        } finally {
            setBusy(false);
        }
    }

    if (!member) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Editar membro</SheetTitle>
                    </SheetHeader>

                    <form
                        key={`${member.id}-${member.userId ?? "no-account"}`}
                        className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2"
                        onSubmit={editForm.handleSubmit(submitEdit)}
                    >
                        {!member.userId ? (
                            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
                                Informe e-mail e senha para criar uma conta de
                                acesso ao app.
                            </p>
                        ) : null}

                        <div className="space-y-2">
                            <Label htmlFor="em-role">Função</Label>
                            <select
                                id="em-role"
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                value={
                                    editForm.watch("roleId") ?? member.roleId
                                }
                                onChange={(e) =>
                                    editForm.setValue("roleId", e.target.value)
                                }
                            >
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="em-name">Nome</Label>
                            <Input
                                id="em-name"
                                {...editForm.register("name")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="em-email">E-mail (acesso ao app)</Label>
                            <Input
                                id="em-email"
                                type="email"
                                autoComplete="off"
                                {...editForm.register("email")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="em-password">
                                {hasAccount ? "Nova senha (opcional)" : "Senha"}
                            </Label>
                            <Input
                                id="em-password"
                                type="password"
                                autoComplete="new-password"
                                {...editForm.register("password")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="em-phone">Telefone</Label>
                            <Input
                                id="em-phone"
                                {...editForm.register("phone")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="em-doc">CPF</Label>
                            <Controller
                                control={editForm.control}
                                name="document"
                                render={({ field }) => (
                                    <Input
                                        id="em-doc"
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                applyCpfMaskInput(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                        placeholder="000.000.000-00"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        maxLength={CPF_FORMATTED_MAX_LENGTH}
                                    />
                                )}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editIsActiveToggle !== false}
                                onCheckedChange={(v) =>
                                    editForm.setValue("isActive", v === true)
                                }
                            />
                            <Label>Ativo</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editCanEnrollStudentFaceToggle === true}
                                onCheckedChange={(v) =>
                                    editForm.setValue(
                                        "canEnrollStudentFace",
                                        v === true,
                                        { shouldDirty: true, shouldValidate: true },
                                    )
                                }
                            />
                            <Label>Pode fotografar alunos</Label>
                        </div>
                        <input
                            type="hidden"
                            {...editForm.register("canEnrollStudentFace")}
                        />

                        <SheetFooter className="mt-auto flex-col gap-2 sm:flex-row sm:justify-between">
                            {isAdmin ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Excluir
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={busy}>
                                    {busy ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Salvar"
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir membro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove face, veículos e acesso ao app. Esta ação
                            não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault();
                                void confirmDelete();
                            }}
                        >
                            {deleting ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
