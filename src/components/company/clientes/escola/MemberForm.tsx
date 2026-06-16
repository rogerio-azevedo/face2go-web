"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch, Controller } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createMemberAction } from "@/app/company/clientes/[clientId]/usuarios/members-actions";
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
import { createMemberSchema } from "@/lib/validations/members";
import { applyCpfMaskInput, CPF_FORMATTED_MAX_LENGTH, normalizeCpf } from "@/lib/utils/document";
import type { ClientRoleRow } from "@/types/domain";

type CreateVals = z.infer<typeof createMemberSchema>;

export function MemberForm({
    open,
    onOpenChange,
    clientId,
    roles,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    roles: ClientRoleRow[];
    onSuccess?: () => void;
}) {
    const [busy, setBusy] = useState(false);

    const createDefaults = useMemo(
        (): CreateVals => ({
            roleId: roles[0]?.id ?? "",
            email: "",
            password: "",
            name: "",
            phone: "",
            document: "",
            isActive: true,
        }),
        [roles],
    );

    const createForm = useForm<CreateVals>({
        resolver: zodResolver(createMemberSchema) as Resolver<CreateVals>,
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
            const r = await createMemberAction(clientId, {
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
                    <SheetTitle>Novo membro</SheetTitle>
                </SheetHeader>

                <form
                    className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2"
                    onSubmit={createForm.handleSubmit(submitCreate)}
                >
                    <div className="space-y-2">
                        <Label htmlFor="m-role">Função</Label>
                        <select
                            id="m-role"
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            value={createForm.watch("roleId")}
                            onChange={(e) =>
                                createForm.setValue("roleId", e.target.value)
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
                        <Label htmlFor="m-name">Nome</Label>
                        <Input id="m-name" {...createForm.register("name")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m-email">E-mail</Label>
                        <Input
                            id="m-email"
                            type="email"
                            autoComplete="off"
                            {...createForm.register("email")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m-password">Senha</Label>
                        <Input
                            id="m-password"
                            type="password"
                            autoComplete="new-password"
                            {...createForm.register("password")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m-phone">Telefone (opcional)</Label>
                        <Input id="m-phone" {...createForm.register("phone")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m-doc">CPF</Label>
                        <Controller
                            control={createForm.control}
                            name="document"
                            render={({ field }) => (
                                <Input
                                    id="m-doc"
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
                        <Button type="submit" disabled={busy || roles.length === 0}>
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
