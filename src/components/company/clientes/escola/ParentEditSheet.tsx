"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch, Controller } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
    deleteResponsibleAction,
    updateResponsibleAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { ResponsibleRow } from "@/types/domain";
import {
    buildFaceSyncSaveHint,
    responsibleCadastralEditRequiresFaceSync,
    type FaceSyncSaveHint,
} from "@/lib/face-sync-after-edit";
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
import { updateResponsibleSchemaForEdit } from "@/lib/validations/school";
import { applyCpfMaskInput, CPF_FORMATTED_MAX_LENGTH, formatCpf, normalizeCpf } from "@/lib/utils/document";

import { ParentLinkedStudentsPanel } from "./ParentLinkedStudentsPanel";

type EditVals = z.infer<ReturnType<typeof updateResponsibleSchemaForEdit>>;

export function ParentEditSheet({
    open,
    onOpenChange,
    clientId,
    isAdmin = false,
    parent,
    onSuccess,
    onDeleted,
    onLinksChanged,
    onFaceSyncOffer,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    isAdmin?: boolean;
    parent: ResponsibleRow | null;
    onSuccess?: (hint?: FaceSyncSaveHint) => void;
    onDeleted?: () => void;
    onLinksChanged?: () => void;
    onFaceSyncOffer?: (hint?: FaceSyncSaveHint) => void;
}) {
    const [busy, setBusy] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
            document: parent.document ? formatCpf(parent.document) : "",
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

    async function confirmDelete() {
        if (!parent) return;
        setDeleting(true);
        try {
            const r = await deleteResponsibleAction(clientId, parent.id);
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
            if (!parent) return;
            const body = {
                ...vals,
                document: normalizeCpf(vals.document ?? ""),
            };
            if (body.password === "" || body.password === undefined) {
                delete body.password;
            }
            const r = await updateResponsibleAction(clientId, parent.id, body);
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            const requiresFaceSync = responsibleCadastralEditRequiresFaceSync(
                { name: parent.name, isActive: parent.isActive },
                body,
            );
            const hint = buildFaceSyncSaveHint(parent, requiresFaceSync);
            onOpenChange(false);
            onSuccess?.(hint);
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
                            <Label htmlFor="ep-doc">CPF</Label>
                            <Controller
                                control={editForm.control}
                                name="document"
                                render={({ field }) => (
                                    <Input
                                        id="ep-doc"
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                applyCpfMaskInput(e.target.value),
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
                        <SheetFooter className="mt-auto flex-row gap-2 px-0 sm:justify-between">
                            {isAdmin ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={busy || deleting}
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <Trash2 className="size-4" />
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
                                <Button type="submit" disabled={busy || deleting}>
                                    {busy ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Salvar"
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </form>

                    <div className="min-w-0">
                        <ParentLinkedStudentsPanel
                            clientId={clientId}
                            parent={parent}
                            active={open}
                            onChanged={onLinksChanged}
                            onFaceSyncOffer={onFaceSyncOffer}
                        />
                    </div>
                </div>
            </SheetContent>

            <AlertDialog
                open={deleteOpen}
                onOpenChange={(next) => {
                    if (!next && !deleting) setDeleteOpen(false);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir responsável?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {parent
                                ? `Isso remove permanentemente o responsável "${parent.name}" dos leitores, câmeras LPR e veículos vinculados. Esta ação não pode ser desfeita.`
                                : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        </Sheet>
    );
}
