"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
    createParentAction,
    updateParentAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { ParentRow } from "@/types/domain";
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
    createParentSchema,
    updateParentSchema,
} from "@/lib/validations/school";

type CreateVals = z.infer<typeof createParentSchema>;
type EditVals = z.infer<typeof updateParentSchema>;

export function ParentForm({
    open,
    onOpenChange,
    clientId,
    mode,
    parent,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    mode: "create" | "edit";
    parent: ParentRow | null;
    onSuccess?: () => void;
}) {
    const [busy, setBusy] = useState(false);

    const createDefaults = useMemo(
        (): CreateVals => ({
            email: "",
            password: "",
            name: "",
            phone: "",
            document: "",
            isActive: true,
        }),
        [],
    );

    const editFormDefaults = useMemo((): EditVals => {
        if (!parent) {
            return {
                name: "",
                phone: "",
                document: "",
                password: "",
                isActive: true,
            };
        }
        return {
            name: parent.name,
            phone: parent.phone ?? "",
            document: parent.document ?? "",
            password: "",
            isActive: parent.isActive,
        };
    }, [parent]);

    const createForm = useForm<CreateVals>({
        resolver: zodResolver(
            createParentSchema,
        ) as Resolver<CreateVals>,
        defaultValues: createDefaults,
    });

    const editForm = useForm<EditVals>({
        resolver: zodResolver(
            updateParentSchema,
        ) as Resolver<EditVals>,
        defaultValues: editFormDefaults,
    });

    const createIsActiveToggle = useWatch({
        control: createForm.control,
        name: "isActive",
        defaultValue: createDefaults.isActive,
    });

    const editIsActiveToggle = useWatch({
        control: editForm.control,
        name: "isActive",
        defaultValue:
            typeof editFormDefaults.isActive === "boolean"
                ? editFormDefaults.isActive
                : true,
    });

    useEffect(() => {
        if (!open) return;
        if (mode === "create") {
            createForm.reset(createDefaults);
        } else if (parent) {
            editForm.reset(editFormDefaults);
        }
    }, [open, mode, parent, createForm, editForm, createDefaults, editFormDefaults]);

    async function submitCreate(vals: CreateVals) {
        setBusy(true);
        try {
            const r = await createParentAction(clientId, vals);
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

    async function submitEdit(vals: EditVals) {
        setBusy(true);
        try {
            if (!parent) return;
            const body = { ...vals };
            if (body.password === "" || body.password === undefined) {
                delete body.password;
            }
            const r = await updateParentAction(clientId, parent.id, body);
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {mode === "create"
                            ? "Novo responsável"
                            : "Editar responsável"}
                    </SheetTitle>
                </SheetHeader>

                {mode === "create" ? (
                    <form
                        className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2"
                        onSubmit={createForm.handleSubmit(submitCreate)}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="p-name">Nome</Label>
                            <Input id="p-name" {...createForm.register("name")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="p-email">E-mail</Label>
                            <Input
                                id="p-email"
                                type="email"
                                autoComplete="off"
                                {...createForm.register("email")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="p-password">Senha</Label>
                            <Input
                                id="p-password"
                                type="password"
                                autoComplete="new-password"
                                {...createForm.register("password")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="p-phone">Telefone (opcional)</Label>
                            <Input id="p-phone" {...createForm.register("phone")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="p-doc">Documento (opcional)</Label>
                            <Input id="p-doc" {...createForm.register("document")} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={createIsActiveToggle !== false}
                                onCheckedChange={(v) =>
                                    createForm.setValue("isActive", v === true)
                                }
                            />
                            <Label>Ativo</Label>
                        </div>
                        <SheetFooter className="mt-auto flex-row gap-2 sm:justify-end">
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
                                    "Cadastrar"
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                ) : (
                    <form
                        className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2"
                        onSubmit={editForm.handleSubmit(submitEdit)}
                    >
                        <div className="text-muted-foreground text-sm">
                            Conta de login já criada ao cadastrar. Para alterar
                            senha, preencha o campo &quot;Nova senha&quot;.
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-name">Nome</Label>
                            <Input id="ep-name" {...editForm.register("name")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-pw">
                                Nova senha (opcional, mín. 8 caracteres)
                            </Label>
                            <Input
                                id="ep-pw"
                                type="password"
                                {...editForm.register("password")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-phone">Telefone</Label>
                            <Input id="ep-phone" {...editForm.register("phone")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-doc">Documento</Label>
                            <Input id="ep-doc" {...editForm.register("document")} />
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
                        <SheetFooter className="mt-auto flex-row gap-2 sm:justify-end">
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
                        </SheetFooter>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    );
}
