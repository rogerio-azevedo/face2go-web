"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
    createSchoolClassAction,
    updateSchoolClassAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { SchoolClassRow, ShiftRow } from "@/types/domain";
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
    createSchoolClassSchema,
} from "@/lib/validations/school";
import type { z } from "zod";

type SchoolClassFormValues = z.infer<typeof createSchoolClassSchema>;

const currentYear = new Date().getFullYear();

export function SchoolClassForm({
    open,
    onOpenChange,
    clientId,
    mode,
    schoolClass,
    shifts,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    mode: "create" | "edit";
    schoolClass: SchoolClassRow | null;
    shifts: ShiftRow[];
    onSuccess?: () => void;
}) {
    const [busy, setBusy] = useState(false);

    const needsShiftPlaceholder =
        mode === "edit" &&
        schoolClass !== null &&
        schoolClass.shiftId === null;

    const defaults = useMemo((): SchoolClassFormValues => {
        if (mode === "edit" && schoolClass) {
            return {
                name: schoolClass.name,
                shiftId: schoolClass.shiftId ?? "",
                year: schoolClass.year,
                isActive: schoolClass.isActive,
            };
        }
        return {
            name: "",
            shiftId: shifts[0]?.id ?? "",
            year: currentYear,
            isActive: true,
        };
    }, [mode, schoolClass, shifts]);

    const form = useForm<SchoolClassFormValues>({
        resolver: zodResolver(
            createSchoolClassSchema,
        ) as Resolver<SchoolClassFormValues>,
        defaultValues: defaults,
    });

    const isActiveToggle = useWatch({
        control: form.control,
        name: "isActive",
        defaultValue: defaults.isActive,
    });

    useEffect(() => {
        if (open) {
            form.reset(defaults);
        }
    }, [open, defaults, form]);

    async function onSubmit(values: SchoolClassFormValues) {
        setBusy(true);
        try {
            if (mode === "create") {
                const r = await createSchoolClassAction(clientId, values);
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
            } else if (schoolClass) {
                const r = await updateSchoolClassAction(
                    clientId,
                    schoolClass.id,
                    values,
                );
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
            }
            onOpenChange(false);
            onSuccess?.();
        } finally {
            setBusy(false);
        }
    }

    const noShifts = shifts.length === 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {mode === "create" ? "Nova turma" : "Editar turma"}
                    </SheetTitle>
                </SheetHeader>

                <form
                    className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="space-y-2">
                        <Label htmlFor="sc-name">Nome</Label>
                        <Input
                            id="sc-name"
                            {...form.register("name")}
                            aria-invalid={!!form.formState.errors.name}
                        />
                        {form.formState.errors.name ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.name.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sc-shift-id">Turno</Label>
                        <select
                            id="sc-shift-id"
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
                            disabled={noShifts}
                            {...form.register("shiftId")}
                        >
                            {noShifts ? (
                                <option value="">
                                    Cadastre turnos na aba Turnos
                                </option>
                            ) : (
                                <>
                                    {needsShiftPlaceholder ? (
                                        <option value="">
                                            Vincule um turno cadastrado…
                                        </option>
                                    ) : null}
                                    {shifts.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                            {!s.isActive ? " (inativo)" : ""}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        {form.formState.errors.shiftId ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.shiftId.message}
                            </p>
                        ) : null}
                        {noShifts ? (
                            <p className="text-muted-foreground text-xs">
                                Crie ao menos um turno antes de vincular à turma.
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sc-year">Ano letivo</Label>
                        <Input
                            id="sc-year"
                            type="number"
                            {...form.register("year", { valueAsNumber: true })}
                            aria-invalid={!!form.formState.errors.year}
                        />
                        {form.formState.errors.year ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.year.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isActiveToggle !== false}
                            onCheckedChange={(v) =>
                                form.setValue("isActive", v === true)
                            }
                        />
                        <Label>Turma ativa</Label>
                    </div>

                    <SheetFooter className="mt-auto flex-row gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={busy || noShifts}>
                            {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : mode === "create" ? (
                                "Criar"
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
