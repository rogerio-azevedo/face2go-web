"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
    deleteStudentAction,
    updateStudentAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { StudentRow } from "@/types/domain";
import {
    buildFaceSyncSaveHint,
    studentCadastralEditRequiresFaceSync,
    type FaceSyncSaveHint,
} from "@/lib/face-sync-after-edit";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { updateStudentSchema } from "@/lib/validations/school";

import { StudentLinkedClassesPanel } from "./StudentLinkedClassesPanel";
import { StudentLinkedResponsiblesPanel } from "./StudentLinkedResponsiblesPanel";

type FormEdit = z.infer<typeof updateStudentSchema>;

function toDateInput(api: string | null | undefined): string {
    if (!api) return "";
    return typeof api === "string" ? api.slice(0, 10) : "";
}

export function StudentEditSheet({
    open,
    onOpenChange,
    clientId,
    isAdmin = false,
    student,
    onSuccess,
    onDeleted,
    onLinksChanged,
    onFaceSyncOffer,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    isAdmin?: boolean;
    student: StudentRow | null;
    onSuccess?: (hint?: FaceSyncSaveHint) => void;
    onDeleted?: () => void;
    onLinksChanged?: () => void;
    onFaceSyncOffer?: (hint?: FaceSyncSaveHint) => void;
}) {
    const [busy, setBusy] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const defaults = useMemo(() => {
        if (!student) {
            return {
                name: "",
                enrollment: "",
                document: "",
                birthDate: "",
                photoKey: "",
                accessSchedule: undefined,
                isActive: true,
            } satisfies Partial<FormEdit>;
        }
        return {
            name: student.name,
            enrollment: student.enrollment,
            document: student.document ?? "",
            birthDate: toDateInput(student.birthDate),
            photoKey: student.photoKey ?? "",
            accessSchedule: student.accessSchedule ?? undefined,
            isActive: student.isActive,
        } satisfies Partial<FormEdit>;
    }, [student]);

    const form = useForm<FormEdit>({
        resolver: zodResolver(updateStudentSchema) as Resolver<FormEdit>,
        defaultValues: defaults as FormEdit,
    });

    const studentIsActiveToggle = useWatch({
        control: form.control,
        name: "isActive",
        defaultValue: defaults.isActive === false ? false : true,
    });

    useEffect(() => {
        if (open && student) {
            form.reset(defaults as FormEdit);
        }
    }, [open, student, defaults, form]);

    async function confirmDelete() {
        if (!student) return;
        setDeleting(true);
        try {
            const r = await deleteStudentAction(clientId, student.id);
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            setDeleteOpen(false);
            onOpenChange(false);
            onDeleted?.();
        } finally {
            setDeleting(false);
        }
    }

    async function submit(values: FormEdit) {
        setBusy(true);
        try {
            if (!student) return;
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
            const requiresFaceSync = studentCadastralEditRequiresFaceSync(
                {
                    name: student.name,
                    isActive: student.isActive,
                    accessSchedule: student.accessSchedule,
                },
                parsed.data,
            );
            const hint = buildFaceSyncSaveHint(student, requiresFaceSync);
            onOpenChange(false);
            onSuccess?.(hint);
        } finally {
            setBusy(false);
        }
    }

    if (!student) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:!max-w-[1200px] sm:!w-[95vw]">
                <SheetHeader className="border-b px-6 pb-4">
                    <SheetTitle>Editar aluno</SheetTitle>
                </SheetHeader>

                <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto px-6 py-6 lg:grid-cols-[2fr_3fr]">
                    <div className="flex min-w-0 flex-col gap-6">
                        <form
                            id="student-edit-form"
                            className="flex flex-col gap-4"
                            onSubmit={form.handleSubmit(submit)}
                        >
                            <h3 className="text-sm font-medium">Dados cadastrais</h3>
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
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="st-doc">Documento (opcional)</Label>
                                <Input id="st-doc" {...form.register("document")} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="st-birth">
                                    Data de nascimento (opcional)
                                </Label>
                                <Input
                                    id="st-birth"
                                    type="date"
                                    {...form.register("birthDate")}
                                />
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
                        </form>

                        <StudentLinkedClassesPanel
                            clientId={clientId}
                            student={student}
                            active={open}
                            onChanged={onLinksChanged}
                            onFaceSyncOffer={onFaceSyncOffer}
                        />

                        <SheetFooter className="mt-auto flex-row gap-2 px-0 sm:justify-between">
                            {isAdmin ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={busy || deleting}
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <Trash2 className="size-4" />
                                    Excluir
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    form="student-edit-form"
                                    disabled={busy || deleting}
                                >
                                    {busy ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Salvar"
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </div>

                    <div className="min-w-0">
                        <StudentLinkedResponsiblesPanel
                            clientId={clientId}
                            student={student}
                            active={open}
                            onChanged={onLinksChanged}
                        />
                    </div>
                </div>
            </SheetContent>

            <AlertDialog
                open={deleteOpen}
                onOpenChange={(next) => {
                    if (!next && !deleting) setDeleteOpen(false);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {student
                                ? `Isso remove permanentemente o aluno "${student.name}" dos leitores e desvincula turmas e responsáveis. Esta ação não pode ser desfeita.`
                                : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault();
                                void confirmDelete();
                            }}
                        >
                            {deleting ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Sheet>
    );
}
