"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateClientRegistrationAction } from "@/app/client/cadastros/actions";
import { updateCompanyRegistrationAction } from "@/app/company/clientes/[clientId]/usuarios/actions";
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
import { updateRegistrationFormSchema,
    type UpdateRegistrationFormValues,
} from "@/features/registrations/validations/update";
import { BlockUnitSelects } from "@/features/client-blocks/components/BlockUnitSelects";
import { listClientBlocksAction } from "@/features/client-blocks/actions";
import type { CatalogBlock } from "@/features/client-blocks/types";
import {
    applyCpfCnpjMaskInput,
    CNPJ_FORMATTED_MAX_LENGTH,
    formatCpfOrCnpj,
    onlyDigits,
} from "@/lib/utils/document";
import type { ClientRegistrationListRow } from "@/types/domain";

function extraString(
    data: Record<string, unknown> | null,
    key: string,
): string {
    const value = data?.[key];
    return typeof value === "string" ? value : "";
}

function textKey(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function findUnitByText(
    catalog: CatalogBlock[],
    blockText: string,
    unitText: string,
) {
    const blockKey = textKey(blockText);
    const unitKey = textKey(unitText);
    if (!unitKey) return null;
    const block = catalog.find(
        (item) => item.isActive && textKey(item.name) === blockKey,
    );
    return (
        block?.units.find(
            (unit) => unit.isActive && textKey(unit.name) === unitKey,
        ) ?? null
    );
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
                birthDate: "",
                blockId: "",
                unitId: "",
                room: "",
            };
        }
        return {
            name: row.name ?? "",
            document: row.document ? formatCpfOrCnpj(row.document) : "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            birthDate: row.birthDate ?? "",
            blockId: "",
            unitId: row.unitId ?? "",
            room: extraString(row.additionalData, "room"),
        };
    }, [row]);

    const form = useForm<UpdateRegistrationFormValues>({
        resolver: zodResolver(updateRegistrationFormSchema),
        defaultValues: defaults,
    });

    const [catalog, setCatalog] = useState<CatalogBlock[]>([]);

    useEffect(() => {
        if (!open || !row) return;
        form.reset(defaults);
    }, [open, row, defaults, form]);

    useEffect(() => {
        if (!open || !showCondo || !row) return;
        let cancel = false;
        void listClientBlocksAction(row.clientId).then((result) => {
            if (cancel || "error" in result) return;
            setCatalog(result.items);
            if (row.unitId || form.getValues("unitId")) return;
            const match = findUnitByText(
                result.items,
                extraString(row.additionalData, "block"),
                extraString(row.additionalData, "unit"),
            );
            if (match) form.setValue("unitId", match.id);
        });
        return () => {
            cancel = true;
        };
    }, [open, showCondo, row, form]);

    const legacyBlock = extraString(row?.additionalData ?? null, "block");
    const legacyUnit = extraString(row?.additionalData ?? null, "unit");
    const showLegacyText = !row?.unitId && Boolean(legacyBlock || legacyUnit);

    const locationBlocks = catalog
        .filter((block) => block.isActive)
        .map((block) => ({
            id: block.id,
            name: block.name,
            units: block.units
                .filter((unit) => unit.isActive || unit.id === row?.unitId)
                .map((unit) => ({ id: unit.id, name: unit.name })),
        }));
    const selectedBlockId =
        form.watch("blockId") ||
        locationBlocks.find((block) =>
            block.units.some((unit) => unit.id === form.watch("unitId")),
        )?.id ||
        "";

    async function onSubmit(values: UpdateRegistrationFormValues) {
        if (!row) return;
        const additionalData: Record<string, unknown> = {};
        if (showRoom && values.room?.trim()) {
            additionalData.room = values.room.trim();
        }

        const body = {
            name: values.name,
            document: onlyDigits(values.document ?? "") || undefined,
            phone: values.phone,
            email: values.email,
            birthDate: values.birthDate || null,
            additionalData:
                Object.keys(additionalData).length > 0
                    ? additionalData
                    : undefined,
            unitId: !showCondo
                ? undefined
                : values.unitId || (row.unitId ? null : undefined),
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
                    <SheetTitle className="flex flex-wrap items-center gap-2">
                        Editar cadastro
                        {row.isMinor ? (
                            <Badge
                                variant="outline"
                                className="border-orange-300 bg-orange-100 font-semibold text-orange-900 hover:bg-orange-100"
                                title="Menor de 18 anos"
                            >
                                Menor de idade
                            </Badge>
                        ) : null}
                    </SheetTitle>
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
                        <Label htmlFor="reg-doc">CPF ou CNPJ</Label>
                        <Controller
                            control={form.control}
                            name="document"
                            render={({ field }) => (
                                <Input
                                    id="reg-doc"
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                        field.onChange(
                                            applyCpfCnpjMaskInput(e.target.value),
                                        )
                                    }
                                    placeholder="000.000.000-00"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={CNPJ_FORMATTED_MAX_LENGTH}
                                />
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reg-birth">Data de nascimento</Label>
                        <Input
                            id="reg-birth"
                            type="date"
                            {...form.register("birthDate")}
                        />
                    </div>
                    {showCondo && showLegacyText ? (
                        <p className="text-muted-foreground text-xs">
                            Texto antigo: Bloco {legacyBlock || "—"} · Unidade{" "}
                            {legacyUnit || "—"}. Escolha a unidade do catálogo
                            para vincular.
                        </p>
                    ) : null}
                    {showCondo ? (
                        <BlockUnitSelects
                            idPrefix="reg"
                            blocks={locationBlocks}
                            blockId={selectedBlockId}
                            unitId={form.watch("unitId") ?? ""}
                            onBlockIdChange={(value) => {
                                form.setValue("blockId", value);
                                form.setValue("unitId", "");
                            }}
                            onUnitIdChange={(value) =>
                                form.setValue("unitId", value)
                            }
                        />
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
