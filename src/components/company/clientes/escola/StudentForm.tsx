"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
    createStudentAction,
    listSchoolClassesAction,
    updateStudentAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { SchoolClassRow, StudentRow } from "@/types/domain";
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
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import {
    createStudentSchema,
    schoolClassTurnLabel,
    updateStudentSchema,
} from "@/lib/validations/school";

type FormCreate = z.infer<typeof createStudentSchema>;

function toDateInput(api: string | null | undefined): string {
    if (!api) return "";
    return typeof api === "string" ? api.slice(0, 10) : "";
}

function formatClassOptionLabel(row: SchoolClassRow) {
    const turn = schoolClassTurnLabel(row);
    return `${row.name} — ${turn} / ${row.year}`;
}

export function StudentForm({
    open,
    onOpenChange,
    clientId,
    mode,
    student,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    mode: "create" | "edit";
    student: StudentRow | null;
    onSuccess?: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [classOptions, setClassOptions] = useState<SchoolClassRow[]>([]);
    const [classOptionsLoading, setClassOptionsLoading] = useState(false);
    const [pickClassIds, setPickClassIds] = useState<string[]>([]);

    const loadClassOptions = useCallback(async () => {
        setClassOptionsLoading(true);
        try {
            const r = await listSchoolClassesAction(clientId);
            if ("error" in r) {
                toast.error(r.error);
                setClassOptions([]);
                return;
            }
            setClassOptions(r.items.filter((c) => c.isActive));
        } finally {
            setClassOptionsLoading(false);
        }
    }, [clientId]);

    const resolver = mode === "create" ? createStudentSchema : updateStudentSchema;

    const defaults = useMemo(() => {
        if (mode === "edit" && student) {
            return {
                name: student.name,
                enrollment: student.enrollment,
                document: student.document ?? "",
                birthDate: toDateInput(student.birthDate),
                photoKey: student.photoKey ?? "",
                accessSchedule: student.accessSchedule ?? undefined,
                isActive: student.isActive,
            } satisfies Partial<FormCreate>;
        }
        return {
            name: "",
            enrollment: "",
            document: "",
            birthDate: "",
            photoKey: "",
            accessSchedule: undefined,
            isActive: true,
        } satisfies Partial<FormCreate>;
    }, [mode, student]);

    const form = useForm<FormCreate>({
        resolver: zodResolver(resolver) as Resolver<FormCreate>,
        defaultValues: defaults as FormCreate,
    });

    const studentIsActiveToggle = useWatch({
        control: form.control,
        name: "isActive",
        defaultValue: defaults.isActive === false ? false : true,
    });

    const activeClasses = useMemo(
        () => (student?.classes ?? []).filter((c) => c.isActive),
        [student],
    );

    useEffect(() => {
        if (open) {
            form.reset(defaults as FormCreate);
            setPickClassIds([]);
            if (mode === "create") {
                void loadClassOptions();
            }
        }
    }, [open, defaults, form, mode, loadClassOptions]);

    const classSelectOptions = useMemo(
        () =>
            classOptions.map((c) => ({
                value: c.id,
                label: formatClassOptionLabel(c),
            })),
        [classOptions],
    );

    async function submit(values: FormCreate) {
        setBusy(true);
        try {
            if (mode === "create") {
                const parsed = createStudentSchema.safeParse(values);
                if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Erro.");
                    return;
                }
                const r = await createStudentAction(clientId, {
                    ...parsed.data,
                    ...(pickClassIds.length > 0 ? { classIds: pickClassIds } : {}),
                });
                if ("error" in r) {
                    toast.error(r.error);
                    return;
                }
            } else if (student) {
                const parsed = updateStudentSchema.safeParse(values);
                if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? "Erro.");
                    return;
                }
                const r = await updateStudentAction(
                    clientId,
                    student.id,
                    parsed.data,
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>
                        {mode === "create" ? "Novo aluno" : "Editar aluno"}
                    </SheetTitle>
                </SheetHeader>

                <form
                    className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2"
                    onSubmit={form.handleSubmit(submit)}
                >
                    <div className="space-y-2">
                        <Label htmlFor="st-name">Nome</Label>
                        <Input id="st-name" {...form.register("name")} />
                        {form.formState.errors.name ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.name.message}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="st-enrollment">Matrícula</Label>
                        <Input
                            id="st-enrollment"
                            {...form.register("enrollment")}
                            disabled={mode === "edit"}
                        />
                        {form.formState.errors.enrollment ? (
                            <p className="text-destructive text-xs">
                                {form.formState.errors.enrollment.message}
                            </p>
                        ) : null}
                    </div>

                    {mode === "create" ? (
                        <div className="space-y-2">
                            <Label htmlFor="st-class">Turmas (opcional)</Label>
                            <SearchableMultiSelect
                                id="st-class"
                                options={classSelectOptions}
                                value={pickClassIds}
                                onChange={setPickClassIds}
                                placeholder={
                                    classOptionsLoading
                                        ? "Carregando turmas..."
                                        : classSelectOptions.length === 0
                                          ? "Nenhuma turma disponível"
                                          : "Selecionar turmas..."
                                }
                                isDisabled={busy || classOptionsLoading}
                                noOptionsMessage="Nenhuma turma encontrada"
                            />
                        </div>
                    ) : null}

                    {mode === "edit" && activeClasses.length > 0 ? (
                        <div className="space-y-2">
                            <Label>Turmas (integração IENH)</Label>
                            <ul className="text-muted-foreground list-inside list-disc text-sm">
                                {activeClasses.map((c) => (
                                    <li key={c.id}>
                                        {c.className} ({c.year})
                                    </li>
                                ))}
                            </ul>
                            <p className="text-muted-foreground text-xs">
                                Vínculos com turmas são atualizados pela
                                sincronização IENH.
                            </p>
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="st-doc">Documento (opcional)</Label>
                        <Input id="st-doc" {...form.register("document")} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="st-birth">
                            Data de nascimento (opcional)
                        </Label>
                        <Input id="st-birth" type="date" {...form.register("birthDate")} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={studentIsActiveToggle !== false}
                            onCheckedChange={(v) =>
                                form.setValue("isActive", v === true)
                            }
                        />
                        <Label>Aluno ativo</Label>
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
