"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    Controller,
    useForm,
    type Resolver,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
    createClientVehicleAction,
    listClientVehicleDriverOptionsAction,
    updateClientVehicleAction,
} from "@/app/company/clientes/[clientId]/usuarios/vehicles-actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import type { ResponsibleRelationshipType, VehicleRow } from "@/types/domain";
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
import { RELATIONSHIP_TYPE_LABELS } from "@/lib/validations/school";
import {
    normalizeVehiclePlate,
    vehicleUpsertSchema,
} from "@/lib/validations/vehicles";

function driverOptionSubtitle(relationshipType: string): string {
    const rt = relationshipType as ResponsibleRelationshipType;
    return RELATIONSHIP_TYPE_LABELS[rt] ?? relationshipType ?? "Outro";
}

type VehicleFormInput = z.input<typeof vehicleUpsertSchema>;

export function VehicleForm({
    open,
    onOpenChange,
    clientId,
    mode,
    vehicle,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    mode: "create" | "edit";
    vehicle: VehicleRow | null;
    onSuccess?: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [driverOptions, setDriverOptions] = useState<
        { id: string; name: string; relationshipType: string }[]
    >([]);

    const defaults = useMemo((): VehicleFormInput => {
        if (mode === "edit" && vehicle) {
            return {
                driverResponsibleId: vehicle.responsibleId ?? "",
                plate: vehicle.plate,
                brand: vehicle.brand,
                model: vehicle.model,
                color: vehicle.color,
            };
        }
        return {
            driverResponsibleId: "",
            plate: "",
            brand: "",
            model: "",
            color: "",
        };
    }, [mode, vehicle]);

    const form = useForm<VehicleFormInput>({
        resolver: zodResolver(
            vehicleUpsertSchema,
        ) as Resolver<VehicleFormInput>,
        defaultValues: defaults,
    });

    useEffect(() => {
        if (open) {
            form.reset(defaults);
        }
    }, [open, defaults, form]);

    useEffect(() => {
        if (!open) return;

        let mounted = true;
        deferInEffect(() => {
            setLoadingDrivers(true);
        });
        void (async () => {
            const r = await listClientVehicleDriverOptionsAction(clientId);
            if (!mounted) return;
            if ("error" in r) {
                toast.error(r.error);
                setDriverOptions([]);
            } else {
                setDriverOptions(r.items);
            }
            setLoadingDrivers(false);
        })();

        return () => {
            mounted = false;
        };
    }, [open, clientId]);

    const noDrivers = !loadingDrivers && driverOptions.length === 0;

    async function onSubmit(values: VehicleFormInput) {
        setBusy(true);
        try {
            const parsed = vehicleUpsertSchema.safeParse(values);
            if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
                return;
            }

            if (mode === "create") {
                const r = await createClientVehicleAction(clientId, parsed.data);
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
            } else if (vehicle) {
                const r = await updateClientVehicleAction(
                    clientId,
                    vehicle.id,
                    parsed.data,
                );
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
            }
            onSuccess?.();
            onOpenChange(false);
        } finally {
            setBusy(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {mode === "create" ? "Novo veículo" : "Editar veículo"}
                    </SheetTitle>
                </SheetHeader>

                <form
                    className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="space-y-2">
                        <Label htmlFor="vh-driver">Condutor (responsável)</Label>
                        <select
                            id="vh-driver"
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
                            disabled={loadingDrivers || noDrivers}
                            {...form.register("driverResponsibleId")}
                        >
                            {!loadingDrivers && driverOptions.length === 0 ? (
                                <option value="">
                                    Cadastre responsáveis na aba Responsáveis
                                </option>
                            ) : (
                                <>
                                    <option value="">Selecione…</option>
                                    {driverOptions.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name} —{" "}
                                            {driverOptionSubtitle(
                                                o.relationshipType,
                                            )}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        {loadingDrivers ? (
                            <p className="text-muted-foreground flex items-center gap-2 text-xs">
                                <Loader2 className="size-3.5 animate-spin" />
                                Carregando responsáveis…
                            </p>
                        ) : null}
                        {form.formState.errors.driverResponsibleId ? (
                            <p className="text-destructive text-xs">
                                {
                                    form.formState.errors.driverResponsibleId
                                        .message
                                }
                            </p>
                        ) : null}
                        {noDrivers ? (
                            <p className="text-muted-foreground text-xs">
                                É necessário ter ao menos um responsável
                                cadastrado para definir o condutor.
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vh-plate">Placa</Label>
                        <Controller
                            name="plate"
                            control={form.control}
                            render={({ field }) => (
                                <Input
                                    id="vh-plate"
                                    aria-invalid={
                                        !!form.formState.errors.plate
                                    }
                                    placeholder="ABC1D23"
                                    maxLength={10}
                                    autoCapitalize="characters"
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                        field.onChange(
                                            normalizeVehiclePlate(
                                                e.target.value,
                                            ),
                                        );
                                    }}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                />
                            )}
                        />
                        {form.formState.errors.plate ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.plate.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vh-brand">Marca</Label>
                        <Input
                            id="vh-brand"
                            {...form.register("brand")}
                            aria-invalid={!!form.formState.errors.brand}
                        />
                        {form.formState.errors.brand ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.brand.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vh-model">Modelo</Label>
                        <Input
                            id="vh-model"
                            {...form.register("model")}
                            aria-invalid={!!form.formState.errors.model}
                        />
                        {form.formState.errors.model ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.model.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vh-color">Cor</Label>
                        <Input
                            id="vh-color"
                            {...form.register("color")}
                            aria-invalid={!!form.formState.errors.color}
                        />
                        {form.formState.errors.color ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.color.message}
                            </p>
                        ) : null}
                    </div>

                    <SheetFooter className="mt-auto flex-row gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={busy || loadingDrivers || noDrivers}
                        >
                            {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : mode === "create" ? (
                                "Cadastrar"
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
