"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateClientRegistrationAction } from "@/app/client/usuarios/actions";
import { updateCompanyRegistrationAction } from "@/app/company/clientes/[clientId]/usuarios/actions";
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
import {
    updateRegistrationFormSchema,
    type UpdateRegistrationFormValues,
} from "@/features/registrations/validations/update";
import {
    applyCpfMaskInput,
    CPF_FORMATTED_MAX_LENGTH,
    formatCpf,
    normalizeCpf,
} from "@/lib/utils/document";
import type { ClientRegistrationListRow } from "@/types/domain";

function extraString(
    data: Record<string, unknown> | null,
    key: string,
): string {
    const value = data?.[key];
    return typeof value === "string" ? value : "";
}

export function RegistrationEditSheet({
    open,
    onOpenChange,
    row,
    clientType,
    variant,
    companyClientId,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: ClientRegistrationListRow | null;
    clientType: string | null;
    variant: "client" | "company";
    companyClientId?: string;
    onSuccess: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const showCondo =
        clientType === "condominium" ||
        Boolean(extraString(row?.additionalData ?? null, "block"));
    const showRoom =
        clientType === "office" ||
        clientType === "clinic" ||
        Boolean(extraString(row?.additionalData ?? null, "room"));

    const defaults = useMemo((): UpdateRegistrationFormValues => {
        if (!row) {
            return {
                name: "",
                document: "",
                phone: "",
                email: "",
                block: "",
                unit: "",
                room: "",
            };
        }
        return {
            name: row.name ?? "",
            document: row.document ? formatCpf(row.document) : "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            block: extraString(row.additionalData, "block"),
            unit: extraString(row.additionalData, "unit"),
            room: extraString(row.additionalData, "room"),
        };
    }, [row]);

    const form = useForm<UpdateRegistrationFormValues>({
        resolver: zodResolver(updateRegistrationFormSchema),
        defaultValues: defaults,
    });

    useEffect(() => {
        if (!open || !row) return;
        form.reset(defaults);
    }, [open, row, defaults, form]);

    async function onSubmit(values: UpdateRegistrationFormValues) {
        if (!row) return;
        const additionalData: Record<string, unknown> = {};
        if (showCondo) {
            additionalData.block = values.block?.trim() ?? "";
            additionalData.unit = values.unit?.trim() ?? "";
        }
        if (showRoom) {
            additionalData.room = values.room?.trim() ?? "";
        }

        const body = {
            name: values.name,
            document: normalizeCpf(values.document) || values.document,
            phone: values.phone,
            email: values.email,
            additionalData:
                Object.keys(additionalData).length > 0
                    ? additionalData
                    : undefined,
        };

        setBusy(true);
        try {
            const res =
                variant === "client"
                    ? await updateClientRegistrationAction(row.id, body)
                    : await updateCompanyRegistrationAction(
                          companyClientId ?? "",
                          row.id,
                          body,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Cadastro atualizado.");
            onOpenChange(false);
            onSuccess();
        } finally {
            setBusy(false);
        }
    }

    if (!row) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col sm:max-w-md">
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle>Editar cadastro</SheetTitle>
                </SheetHeader>
                <form
                    className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="space-y-2">
                        <Label htmlFor="reg-name">Nome</Label>
                        <Input id="reg-name" {...form.register("name")} />
                        {form.formState.errors.name ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.name.message}
                            </p>
                        ) : null}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reg-email">E-mail</Label>
                        <Input
                            id="reg-email"
                            type="email"
                            autoComplete="off"
                            {...form.register("email")}
                        />
                        {form.formState.errors.email ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.email.message}
                            </p>
                        ) : null}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reg-phone">Telefone</Label>
                        <Input id="reg-phone" {...form.register("phone")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reg-doc">CPF</Label>
                        <Controller
                            control={form.control}
                            name="document"
                            render={({ field }) => (
                                <Input
                                    id="reg-doc"
                                    value={field.value}
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
                    {showCondo ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="reg-block">Bloco</Label>
                                <Input
                                    id="reg-block"
                                    {...form.register("block")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-unit">Unidade</Label>
                                <Input
                                    id="reg-unit"
                                    {...form.register("unit")}
                                />
                            </div>
                        </>
                    ) : null}
                    {showRoom ? (
                        <div className="space-y-2">
                            <Label htmlFor="reg-room">Sala</Label>
                            <Input id="reg-room" {...form.register("room")} />
                        </div>
                    ) : null}
                    <SheetFooter className="mt-auto px-0 pb-6">
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
            </SheetContent>
        </Sheet>
    );
}
