"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { removeShiftAction } from "@/app/company/clientes/[clientId]/usuarios/shifts-actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    SHIFT_WEEKDAY_KEYS,
} from "@/lib/validations/shifts";
import type { ShiftRow, ShiftSchedule, ShiftWeekday } from "@/types/domain";

import { ShiftForm } from "./ShiftForm";

/** Rótulos curtos para lista de agenda (uma linha por dia). */
const DAY_SHORT: Record<ShiftWeekday, string> = {
    sunday: "Dom",
    monday: "Seg",
    tuesday: "Ter",
    wednesday: "Qua",
    thursday: "Qui",
    friday: "Sex",
    saturday: "Sáb",
};

const WEEKDAY_ORDER: ShiftWeekday[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
];

function formatWindows(schedule: ShiftSchedule, day: ShiftWeekday): string {
    const wins = schedule[day];
    if (!wins?.length) return "";
    return wins.map((w) => `${w.start}–${w.end}`).join(", ");
}

/** Linhas legíveis para a coluna Agenda (horários 24h). */
function scheduleSummaryLines(schedule: ShiftSchedule): string[] {
    const lines: string[] = [];

    const weekendUsed =
        (schedule.saturday?.length ?? 0) > 0 ||
        (schedule.sunday?.length ?? 0) > 0;

    const monFriFilled = WEEKDAY_ORDER.every((d) => (schedule[d]?.length ?? 0) > 0);
    const monFriSingleWindow = WEEKDAY_ORDER.every(
        (d) => schedule[d]?.length === 1,
    );
    const firstMon = schedule.monday?.[0];
    const monFriSameSlot =
        firstMon &&
        WEEKDAY_ORDER.every(
            (d) =>
                schedule[d]?.[0]?.start === firstMon.start &&
                schedule[d]?.[0]?.end === firstMon.end,
        );

    if (monFriFilled && monFriSingleWindow && monFriSameSlot && !weekendUsed) {
        lines.push(`Seg a Sex: ${firstMon.start}–${firstMon.end}`);
        return lines;
    }

    for (const day of SHIFT_WEEKDAY_KEYS) {
        const text = formatWindows(schedule, day);
        if (text) lines.push(`${DAY_SHORT[day]}: ${text}`);
    }

    return lines.length > 0 ? lines : ["Sem horários"];
}

export function ShiftsSection({
    clientId,
    initialShifts,
}: {
    clientId: string;
    initialShifts: ShiftRow[];
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editRow, setEditRow] = useState<ShiftRow | null>(null);
    const [pendingDelete, setPendingDelete] = useState<ShiftRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    function refresh() {
        startTransition(() => router.refresh());
    }

    async function confirmDelete() {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            const r = await removeShiftAction(clientId, pendingDelete.id);
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            toast.success("Horário removido.");
            setPendingDelete(null);
            refresh();
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <div className="flex justify-end gap-2 mb-2">
                <Button
                    type="button"
                    size="default"
                    onClick={() => {
                        setEditRow(null);
                        setSheetOpen(true);
                    }}
                >
                    Novo horário
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead className="hidden md:table-cell">
                                Agenda
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialShifts.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum horário cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialShifts.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        {row.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden max-w-[min(28rem,calc(100vw-12rem))] align-top md:table-cell">
                                        <div className="flex flex-col gap-0.5 text-sm leading-snug">
                                            {scheduleSummaryLines(
                                                row.schedule,
                                            ).map((line, i) => (
                                                <span key={i}>{line}</span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {row.isActive ? (
                                            <Badge>Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Inativo
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditRow(row);
                                                    setSheetOpen(true);
                                                }}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() =>
                                                    setPendingDelete(row)
                                                }
                                            >
                                                Excluir
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ShiftForm
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                clientId={clientId}
                mode={editRow ? "edit" : "create"}
                shift={editRow}
                onSuccess={() => {
                    toast.success(
                        editRow ? "Horário atualizado." : "Horário criado.",
                    );
                    refresh();
                }}
            />

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) setPendingDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir horário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete
                                ? `Isso remove o horário "${pendingDelete.name}". Esta ação não pode ser desfeita.`
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
        </>
    );
}
