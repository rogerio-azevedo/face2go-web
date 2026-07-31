"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch, Controller } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
    createResponsibleAction,
    lookupResponsibleAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import { PersonLookupBanner } from "@/components/company/clientes/escola/PersonLookupBanner";
import { usePersonLookup } from "@/components/company/clientes/escola/use-person-lookup";
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
import {
    applyCpfMaskInput,
    CPF_FORMATTED_MAX_LENGTH,
    normalizeCpf,
} from "@/lib/utils/document";

type CreateVals = z.infer<typeof createResponsibleSchema>;

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-destructive text-sm">{message}</p>;
}

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
    const lookup = usePersonLookup(clientId, lookupResponsibleAction);
    const {
        lookupResult,
        checking,
        lookupError,
        runLookup,
        resetLookup,
        requirePassword,
        submitBlocked,
    } = lookup;

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
        resolver: zodResolver(createResponsibleSchema) as Resolver<CreateVals>,
        defaultValues: createDefaults,
    });

    const createIsActiveToggle = useWatch({
        control: createForm.control,
        name: "isActive",
        defaultValue: createDefaults.isActive,
    });

    const { errors } = createForm.formState;

    useEffect(() => {
        if (!open) return;
        createForm.reset(createDefaults);
        resetLookup();
    }, [open, createForm, createDefaults, resetLookup]);

    useEffect(() => {
        createForm.clearErrors("password");
    }, [requirePassword, createForm]);

    useEffect(() => {
        if (!lookupResult?.matched || !lookupResult.profile) return;
        const profile = lookupResult.profile;
        if (profile.name) createForm.setValue("name", profile.name);
        if (profile.email) createForm.setValue("email", profile.email);
        if (profile.phone) createForm.setValue("phone", profile.phone);
        if (lookupResult.hasLogin) {
            createForm.setValue("password", "");
        }
    }, [lookupResult, createForm]);

    const handleDocumentBlur = useCallback(async () => {
        const document = createForm.getValues("document");
        await runLookup(document, createForm.getValues("email"));
    }, [createForm, runLookup]);

    const handleEmailBlur = useCallback(async () => {
        const email = createForm.getValues("email");
        await runLookup(createForm.getValues("document"), email);
    }, [createForm, runLookup]);

    async function submitCreate(vals: CreateVals) {
        if (submitBlocked) return;
        if (requirePassword && !vals.password) {
            createForm.setError("password", {
                message: "Informe a senha para o cadastro.",
            });
            return;
        }
        setBusy(true);
        try {
            const payload = { ...vals, document: normalizeCpf(vals.document) };
            if (!requirePassword || !payload.password) {
                delete payload.password;
            }
            const r = await createResponsibleAction(clientId, payload);
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

    const emailLocked = lookupResult?.matched && lookupResult.hasLogin;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg">
                <SheetHeader className="border-b px-6 pt-6 pb-4">
                    <SheetTitle className="text-lg">Novo responsável</SheetTitle>
                </SheetHeader>

                <form
                    className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
                    onSubmit={createForm.handleSubmit(submitCreate, () => {
                        toast.error("Verifique os campos do formulário.");
                    })}
                >
                    <div className="space-y-2">
                        <Label htmlFor="p-doc">CPF</Label>
                        <Controller
                            control={createForm.control}
                            name="document"
                            render={({ field }) => (
                                <Input
                                    id="p-doc"
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                        resetLookup();
                                        field.onChange(
                                            applyCpfMaskInput(e.target.value),
                                        );
                                    }}
                                    onBlur={() => {
                                        field.onBlur();
                                        void handleDocumentBlur();
                                    }}
                                    placeholder="000.000.000-00"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={CPF_FORMATTED_MAX_LENGTH}
                                />
                            )}
                        />
                        <FieldError message={errors.document?.message} />
                    </div>

                    <PersonLookupBanner
                        lookupResult={lookupResult}
                        checking={checking}
                        lookupError={lookupError}
                    />

                    <div className="space-y-2">
                        <Label htmlFor="p-name">Nome</Label>
                        <Input id="p-name" {...createForm.register("name")} />
                        <FieldError message={errors.name?.message} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="p-email">E-mail</Label>
                        <Input
                            id="p-email"
                            type="email"
                            autoComplete="off"
                            readOnly={emailLocked}
                            className={emailLocked ? "bg-muted" : undefined}
                            {...createForm.register("email", {
                                onChange: () => resetLookup(),
                                onBlur: () => {
                                    void handleEmailBlur();
                                },
                            })}
                        />
                        <FieldError message={errors.email?.message} />
                    </div>
                    {requirePassword ? (
                        <div className="space-y-2">
                            <Label htmlFor="p-password">Senha</Label>
                            <Input
                                id="p-password"
                                type="password"
                                autoComplete="new-password"
                                {...createForm.register("password")}
                            />
                            <FieldError message={errors.password?.message} />
                        </div>
                    ) : (
                        <p className="text-muted-foreground rounded-md border bg-muted/40 px-3 py-2 text-sm">
                            A conta de login já existe — a senha atual será
                            mantida.
                        </p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="p-phone">Telefone (opcional)</Label>
                        <Input id="p-phone" {...createForm.register("phone")} />
                    </div>
                    <div className="flex items-center gap-3 rounded-md border px-4 py-3">
                        <Switch
                            checked={createIsActiveToggle !== false}
                            onCheckedChange={(v) =>
                                createForm.setValue("isActive", v === true)
                            }
                        />
                        <Label>Ativo</Label>
                    </div>
                    <SheetFooter className="mt-2 flex-row gap-3 border-t px-0 pt-4 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={busy || submitBlocked || checking}
                        >
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
