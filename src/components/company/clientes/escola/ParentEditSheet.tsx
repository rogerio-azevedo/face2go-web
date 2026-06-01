"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { updateResponsibleAction } from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { ResponsibleRow } from "@/types/domain";
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
import { updateResponsibleSchemaForEdit } from "@/lib/validations/school";

import { ParentLinkedStudentsPanel } from "./ParentLinkedStudentsPanel";

type EditVals = z.infer<ReturnType<typeof updateResponsibleSchemaForEdit>>;

export function ParentEditSheet({
    open,
    onOpenChange,
    clientId,
    parent,
    onSuccess,
    onLinksChanged,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    parent: ResponsibleRow | null;
    onSuccess?: () => void;
    onLinksChanged?: () => void;
}) {
    const [busy, setBusy] = useState(false);

    const hasAccount = Boolean(parent?.userId);

    const editSchema = useMemo(
        () => updateResponsibleSchemaForEdit(hasAccount),
        [hasAccount],
    );

    const editFormDefaults = useMemo((): EditVals => {
        if (!parent) {
            return {
                name: "",
                email: "",
                phone: "",
                document: "",
                password: "",
                isActive: true,
            };
        }
        return {
            name: parent.name,
            email: parent.email ?? "",
            phone: parent.phone ?? "",
            document: parent.document ?? "",
            password: "",
            isActive: parent.isActive,
        };
    }, [parent]);

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

    useEffect(() => {
        if (!open || !parent) return;
        editForm.reset(editFormDefaults);
    }, [open, parent, editForm, editFormDefaults, editSchema]);

    async function submitEdit(vals: EditVals) {
        setBusy(true);
        try {
            if (!parent) return;
            const body = { ...vals };
            if (body.password === "" || body.password === undefined) {
                delete body.password;
            }
            const r = await updateResponsibleAction(clientId, parent.id, body);
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

    if (!parent) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:!max-w-[1200px] sm:!w-[95vw]">
                <SheetHeader className="border-b px-6 pb-4">
                    <SheetTitle>Editar responsável</SheetTitle>
                </SheetHeader>

                <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[2fr_3fr]">
                    <form
                        key={`${parent.id}-${parent.userId ?? "no-account"}`}
                        className="flex min-w-0 flex-col gap-4"
                        onSubmit={editForm.handleSubmit(submitEdit)}
                    >
                        <h3 className="text-sm font-medium">Dados cadastrais</h3>
                        {!parent.userId ? (
                            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
                                Informe e-mail e senha para criar uma conta de
                                acesso ao app.
                            </p>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Altere o e-mail de acesso ou a senha conforme
                                necessário.
                            </p>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="ep-name">Nome</Label>
                            <Input
                                id="ep-name"
                                {...editForm.register("name")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-email">E-mail (acesso ao app)</Label>
                            <Input
                                id="ep-email"
                                type="email"
                                autoComplete="off"
                                {...editForm.register("email")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-pw">
                                {parent.userId
                                    ? "Nova senha (opcional, mín. 8 caracteres)"
                                    : "Senha (mín. 8 caracteres)"}
                            </Label>
                            <Input
                                id="ep-pw"
                                type="password"
                                autoComplete="new-password"
                                {...editForm.register("password")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-phone">Telefone</Label>
                            <Input
                                id="ep-phone"
                                {...editForm.register("phone")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ep-doc">Documento</Label>
                            <Input
                                id="ep-doc"
                                {...editForm.register("document")}
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
                        <SheetFooter className="mt-auto flex-row gap-2 px-0 sm:justify-end">
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

                    <div className="min-w-0">
                        <ParentLinkedStudentsPanel
                            clientId={clientId}
                            parent={parent}
                            active={open}
                            onChanged={onLinksChanged}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
