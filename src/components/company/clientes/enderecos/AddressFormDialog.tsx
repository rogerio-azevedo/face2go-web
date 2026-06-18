"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
    createClientAddressAction,
    updateClientAddressAction,
} from "@/app/company/clientes/[clientId]/enderecos/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    clientAddressFormSchema,
    type ClientAddressFormInput,
} from "@/lib/validations/client-addresses";
import type { ClientAddressRow } from "@/types/client-address";

import { HereAddressPicker } from "./HereAddressPicker";

type AddressFormDialogProps = {
    clientId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial?: ClientAddressRow | null;
    onSaved?: () => void;
};

function toFormDefaults(row?: ClientAddressRow | null): ClientAddressFormInput {
    if (!row) {
        return {
            label: "Principal",
            isPrimary: false,
            cep: undefined,
            street: undefined,
            number: undefined,
            complement: undefined,
            neighborhood: undefined,
            city: undefined,
            state: undefined,
            country: "BR",
            latitude: undefined,
            longitude: undefined,
            geocodingProvider: "manual",
            geocodingPrecision: undefined,
            hereLocationId: undefined,
        };
    }
    return {
        label: row.label,
        isPrimary: row.isPrimary,
        cep: row.cep ?? undefined,
        street: row.street ?? undefined,
        number: row.number ?? undefined,
        complement: row.complement ?? undefined,
        neighborhood: row.neighborhood ?? undefined,
        city: row.city ?? undefined,
        state: row.state ?? undefined,
        country: row.country,
        latitude: row.latitude ?? undefined,
        longitude: row.longitude ?? undefined,
        geocodingProvider: row.geocodingProvider,
        geocodingPrecision: row.geocodingPrecision ?? undefined,
        hereLocationId: row.hereLocationId ?? undefined,
    };
}

export function AddressFormDialog({
    clientId,
    open,
    onOpenChange,
    initial,
    onSaved,
}: AddressFormDialogProps) {
    const [pending, startTransition] = useTransition();
    const isEdit = Boolean(initial?.id);

    const form = useForm<ClientAddressFormInput>({
        resolver: zodResolver(clientAddressFormSchema),
        defaultValues: toFormDefaults(initial),
    });

    useEffect(() => {
        if (open) {
            form.reset(toFormDefaults(initial));
        }
    }, [open, initial, form]);

    const onInvalid = (errors: FieldErrors<ClientAddressFormInput>) => {
        const firstError = Object.values(errors).find(
            (error) => error?.message,
        );
        toast.error(
            typeof firstError?.message === "string"
                ? firstError.message
                : "Revise os campos do formulário.",
        );
    };

    const onSubmit = form.handleSubmit((values) => {
        startTransition(async () => {
            const result = isEdit
                ? await updateClientAddressAction(clientId, initial!.id, values)
                : await createClientAddressAction(clientId, values);

            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success(isEdit ? "Endereço atualizado." : "Endereço criado.");
            onOpenChange(false);
            onSaved?.();
        });
    }, onInvalid);

    const setField = (
        key: keyof ClientAddressFormInput,
        value: ClientAddressFormInput[keyof ClientAddressFormInput],
    ) => {
        form.setValue(key, value as never, { shouldDirty: true });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:!max-w-[1100px] sm:!w-[92vw]">
                <SheetHeader className="shrink-0 border-b px-6 py-4">
                    <SheetTitle className="text-lg">
                        {isEdit ? "Editar endereço" : "Novo endereço"}
                    </SheetTitle>
                </SheetHeader>

                <form
                    onSubmit={onSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                            <section className="min-w-0">
                                <HereAddressPicker
                                    key={
                                        open
                                            ? (initial?.id ?? "new-address")
                                            : "closed"
                                    }
                                    value={{
                                        cep: form.watch("cep"),
                                        street: form.watch("street"),
                                        number: form.watch("number"),
                                        neighborhood: form.watch("neighborhood"),
                                        city: form.watch("city"),
                                        state: form.watch("state"),
                                        country: form.watch("country"),
                                        latitude: form.watch("latitude"),
                                        longitude: form.watch("longitude"),
                                        geocodingProvider:
                                            form.watch("geocodingProvider"),
                                        geocodingPrecision:
                                            form.watch("geocodingPrecision"),
                                        hereLocationId:
                                            form.watch("hereLocationId"),
                                    }}
                                    onChange={(next) => {
                                        Object.entries(next).forEach(
                                            ([key, val]) => {
                                                if (val !== undefined) {
                                                    setField(
                                                        key as keyof ClientAddressFormInput,
                                                        val as ClientAddressFormInput[keyof ClientAddressFormInput],
                                                    );
                                                }
                                            },
                                        );
                                    }}
                                />
                            </section>

                            <section className="space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold">
                                        Identificação
                                    </h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="address-label">
                                            Rótulo
                                        </Label>
                                        <Input
                                            id="address-label"
                                            placeholder="Matriz, Filial..."
                                            {...form.register("label")}
                                        />
                                        {form.formState.errors.label ? (
                                            <p className="text-destructive text-sm">
                                                {
                                                    form.formState.errors.label
                                                        .message
                                                }
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5">
                                        <Checkbox
                                            id="address-primary"
                                            checked={form.watch("isPrimary")}
                                            onCheckedChange={(checked) =>
                                                setField(
                                                    "isPrimary",
                                                    Boolean(checked),
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor="address-primary"
                                            className="!mt-0 cursor-pointer"
                                        >
                                            Endereço principal do cliente
                                        </Label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold">
                                        Dados do endereço
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="address-cep">
                                                CEP
                                            </Label>
                                            <Input
                                                id="address-cep"
                                                {...form.register("cep")}
                                            />
                                            {form.formState.errors.cep ? (
                                                <p className="text-destructive text-sm">
                                                    {
                                                        form.formState.errors.cep
                                                            .message
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address-number">
                                                Número
                                            </Label>
                                            <Input
                                                id="address-number"
                                                {...form.register("number")}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="address-street">
                                                Logradouro
                                            </Label>
                                            <Input
                                                id="address-street"
                                                {...form.register("street")}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="address-complement">
                                                Complemento
                                            </Label>
                                            <Input
                                                id="address-complement"
                                                {...form.register(
                                                    "complement",
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address-neighborhood">
                                                Bairro
                                            </Label>
                                            <Input
                                                id="address-neighborhood"
                                                {...form.register(
                                                    "neighborhood",
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address-city">
                                                Cidade
                                            </Label>
                                            <Input
                                                id="address-city"
                                                {...form.register("city")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address-state">
                                                UF
                                            </Label>
                                            <Input
                                                id="address-state"
                                                maxLength={2}
                                                className="uppercase"
                                                {...form.register("state")}
                                            />
                                            {form.formState.errors.state ? (
                                                <p className="text-destructive text-sm">
                                                    {
                                                        form.formState.errors
                                                            .state.message
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <details className="bg-muted/30 rounded-lg border px-4 py-3">
                                    <summary className="cursor-pointer text-sm font-medium">
                                        Coordenadas (avançado)
                                    </summary>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="address-lat">
                                                Latitude
                                            </Label>
                                            <Input
                                                id="address-lat"
                                                type="number"
                                                step="any"
                                                value={
                                                    form.watch("latitude") ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setField(
                                                        "latitude",
                                                        e.target.value === ""
                                                            ? undefined
                                                            : Number(
                                                                  e.target
                                                                      .value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address-lng">
                                                Longitude
                                            </Label>
                                            <Input
                                                id="address-lng"
                                                type="number"
                                                step="any"
                                                value={
                                                    form.watch("longitude") ??
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setField(
                                                        "longitude",
                                                        e.target.value === ""
                                                            ? undefined
                                                            : Number(
                                                                  e.target
                                                                      .value,
                                                              ),
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </details>
                            </section>
                        </div>
                    </div>

                    <SheetFooter className="shrink-0 border-t bg-background px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={pending}>
                            {pending ? "Salvando..." : "Salvar endereço"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
