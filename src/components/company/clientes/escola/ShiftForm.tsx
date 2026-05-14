"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
    createShiftAction,
    updateShiftAction,
} from "@/app/company/clientes/[clientId]/usuarios/shifts-actions";
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
    SHIFT_WEEKDAY_KEYS,
    SHIFT_WEEKDAY_LABELS,
    createShiftSchema,
    updateShiftSchema,
} from "@/lib/validations/shifts";
import type { ShiftRow, ShiftSchedule, ShiftWeekday } from "@/types/domain";

type SlotRow = { id: string; start: string; end: string };

type DaySlots = Record<ShiftWeekday, SlotRow[]>;

function emptyDaySlots(): DaySlots {
    return {
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
    };
}

function slotsFromSchedule(schedule: ShiftSchedule | undefined): DaySlots {
    const out = emptyDaySlots();
    if (!schedule) return out;
    for (const day of SHIFT_WEEKDAY_KEYS) {
        const wins = schedule[day];
        if (wins?.length) {
            out[day] = wins.map((w) => ({
                id: crypto.randomUUID(),
                start: w.start,
                end: w.end,
            }));
        }
    }
    return out;
}

function scheduleFromSlots(slots: DaySlots): ShiftSchedule {
    const schedule: ShiftSchedule = {};
    for (const day of SHIFT_WEEKDAY_KEYS) {
        const wins = slots[day]
            .map((w) => ({
                start: normalizeTime(w.start),
                end: normalizeTime(w.end),
            }))
            .filter((w) => w.start && w.end);
        if (wins.length > 0) {
            schedule[day] = wins;
        }
    }
    return schedule;
}

/** Alguns navegadores devolvem `HH:MM:SS` em inputs `type="time"`. */
function normalizeTime(raw: string): string {
    const s = raw.trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(s)) {
        return s.slice(0, 5);
    }
    return s;
}

function incompleteRowMessage(slots: DaySlots): string | null {
    for (const day of SHIFT_WEEKDAY_KEYS) {
        for (const row of slots[day]) {
            const a = row.start.trim();
            const b = row.end.trim();
            if ((a && !b) || (!a && b)) {
                return `Complete início e fim em ${SHIFT_WEEKDAY_LABELS[day]} ou remova a linha.`;
            }
        }
    }
    return null;
}

const shiftBasicsSchema = z.object({
    name: z.string().trim().min(1, "Informe o nome do turno.").max(255),
    isActive: z.boolean(),
});

type ShiftBasicsValues = z.infer<typeof shiftBasicsSchema>;

export function ShiftForm({
    open,
    onOpenChange,
    clientId,
    mode,
    shift,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    mode: "create" | "edit";
    shift: ShiftRow | null;
    onSuccess?: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [slots, setSlots] = useState<DaySlots>(() => emptyDaySlots());

    const defaults = useMemo((): ShiftBasicsValues => {
        if (mode === "edit" && shift) {
            return {
                name: shift.name,
                isActive: shift.isActive,
            };
        }
        return {
            name: "",
            isActive: true,
        };
    }, [mode, shift]);

    const form = useForm<ShiftBasicsValues>({
        resolver: zodResolver(shiftBasicsSchema) as Resolver<ShiftBasicsValues>,
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
            setSlots(slotsFromSchedule(shift?.schedule));
        }
    }, [open, defaults, form, shift]);

    function addSlot(day: ShiftWeekday) {
        setSlots((prev) => {
            if (prev[day].length >= 4) return prev;
            return {
                ...prev,
                [day]: [
                    ...prev[day],
                    { id: crypto.randomUUID(), start: "", end: "" },
                ],
            };
        });
    }

    function removeSlot(day: ShiftWeekday, rowId: string) {
        setSlots((prev) => ({
            ...prev,
            [day]: prev[day].filter((r) => r.id !== rowId),
        }));
    }

    function updateSlot(
        day: ShiftWeekday,
        rowId: string,
        field: "start" | "end",
        value: string,
    ) {
        setSlots((prev) => ({
            ...prev,
            [day]: prev[day].map((row) =>
                row.id === rowId ? { ...row, [field]: value } : row,
            ),
        }));
    }

    async function onSubmit(values: ShiftBasicsValues) {
        const incomplete = incompleteRowMessage(slots);
        if (incomplete) {
            toast.error(incomplete);
            return;
        }

        const schedule = scheduleFromSlots(slots);

        setBusy(true);
        try {
            if (mode === "create") {
                const payload = { ...values, schedule };
                const parsed = createShiftSchema.safeParse(payload);
                if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
                    return;
                }
                const r = await createShiftAction(clientId, parsed.data);
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
            } else if (shift) {
                const payload = {
                    name: values.name,
                    schedule,
                    isActive: values.isActive,
                };
                const parsed = updateShiftSchema.safeParse(payload);
                if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
                    return;
                }
                const r = await updateShiftAction(clientId, shift.id, parsed.data);
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>
                        {mode === "create" ? "Novo turno" : "Editar turno"}
                    </SheetTitle>
                </SheetHeader>

                <form
                    className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="space-y-2">
                        <Label htmlFor="shift-name">Nome</Label>
                        <Input
                            id="shift-name"
                            {...form.register("name")}
                            aria-invalid={!!form.formState.errors.name}
                        />
                        {form.formState.errors.name ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.name.message}
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
                        <Label>Turno ativo</Label>
                    </div>

                    <div className="space-y-3">
                        <p className="text-muted-foreground text-xs">
                            Até 4 janelas por dia (formato 24h). Deixe linhas
                            vazias ou remova-as — apenas horários completos são
                            salvos.
                        </p>
                        {SHIFT_WEEKDAY_KEYS.map((day) => (
                            <div
                                key={day}
                                className="bg-muted/40 space-y-2 rounded-md border p-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium">
                                        {SHIFT_WEEKDAY_LABELS[day]}
                                    </span>
                                    {slots[day].length < 4 ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => addSlot(day)}
                                        >
                                            <Plus className="size-3.5" />
                                            Janela
                                        </Button>
                                    ) : null}
                                </div>
                                {slots[day].length === 0 ? (
                                    <p className="text-muted-foreground text-xs">
                                        Nenhum horário neste dia.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {slots[day].map((row) => (
                                            <div
                                                key={row.id}
                                                className="flex flex-wrap items-end gap-2"
                                            >
                                                <div className="space-y-1">
                                                    <Label className="text-xs">
                                                        Início
                                                    </Label>
                                                    <Input
                                                        type="time"
                                                        step={60}
                                                        value={row.start}
                                                        onChange={(e) =>
                                                            updateSlot(
                                                                day,
                                                                row.id,
                                                                "start",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-34"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">
                                                        Fim
                                                    </Label>
                                                    <Input
                                                        type="time"
                                                        step={60}
                                                        value={row.end}
                                                        onChange={(e) =>
                                                            updateSlot(
                                                                day,
                                                                row.id,
                                                                "end",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-34"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground shrink-0"
                                                    aria-label="Remover janela"
                                                    onClick={() =>
                                                        removeSlot(day, row.id)
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <SheetFooter className="mt-auto flex-row gap-2 border-t pt-4 sm:justify-end">
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
