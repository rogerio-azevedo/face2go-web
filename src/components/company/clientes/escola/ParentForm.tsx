"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch, Controller } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createResponsibleAction } from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
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
import { createResponsibleSchema } from "@/lib/validations/school";
import { applyCpfMaskInput, CPF_FORMATTED_MAX_LENGTH, normalizeCpf } from "@/lib/utils/document";

type CreateVals = z.infer<typeof createResponsibleSchema>;

export function ParentForm({
    open,
    onOpenChange,
    clientId,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
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

    const createForm = useForm<CreateVals>({
        resolver: zodResolver(
            createResponsibleSchema,
        ) as Resolver<CreateVals>,
        defaultValues: createDefaults,
    });

    const createIsActiveToggle = useWatch({
        control: createForm.control,
        name: "isActive",
        defaultValue: createDefaults.isActive,
    });

    useEffect(() => {
        if (!open) return;
        createForm.reset(createDefaults);
    }, [open, createForm, createDefaults]);

    async function submitCreate(vals: CreateVals) {
        setBusy(true);
        try {
            const r = await createResponsibleAction(clientId, {
                ...vals,
                document: normalizeCpf(vals.document),
            });
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
                    <SheetTitle>Novo responsável</SheetTitle>
                </SheetHeader>

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
                        <Label htmlFor="p-doc">CPF</Label>
                        <Controller
                            control={createForm.control}
                            name="document"
                            render={({ field }) => (
                                <Input
                                    id="p-doc"
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                        field.onChange(applyCpfMaskInput(e.target.value))
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
            </SheetContent>
        </Sheet>
    );
}
