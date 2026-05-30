"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    cancelPickupAuthorizationAction,
    getResponsibleByIdAction,
    getStudentByIdAction,
    markUsedPickupAuthorizationAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
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
import type {
    PickupAuthorizationRow,
    PickupAuthorizationStatus,
    ResponsibleRow,
    StudentRow,
} from "@/types/domain";

function statusLabel(status: PickupAuthorizationStatus): string {
    switch (status) {
        case "active":
            return "Ativa";
        case "used":
            return "Utilizada";
        case "expired":
            return "Expirada";
        case "cancelled":
            return "Cancelada";
        default:
            return status;
    }
}

function statusVariant(
    status: PickupAuthorizationStatus,
): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "active":
            return "default";
        case "used":
            return "secondary";
        case "expired":
            return "outline";
        case "cancelled":
            return "destructive";
        default:
            return "outline";
    }
}

function formatRange(from: string, until: string): string {
    const opt: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    };
    const a = new Date(from);
    const b = new Date(until);
    return `${a.toLocaleString("pt-BR", opt)} — ${b.toLocaleString("pt-BR", opt)}`;
}

export function PickupAuthorizationsSection({
    clientId,
    initialAuthorizations,
}: {
    clientId: string;
    initialAuthorizations: PickupAuthorizationRow[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [rows, setRows] =
        useState<PickupAuthorizationRow[]>(initialAuthorizations);
    const [studentById, setStudentById] = useState(
        () => new Map<string, StudentRow>(),
    );
    const [responsibleById, setResponsibleById] = useState(
        () => new Map<string, ResponsibleRow>(),
    );

    useEffect(() => {
        setRows(initialAuthorizations);
    }, [initialAuthorizations]);

    useEffect(() => {
        if (rows.length === 0) {
            setStudentById(new Map());
            setResponsibleById(new Map());
            return;
        }

        const studentIds = [...new Set(rows.map((r) => r.studentId))];
        const responsibleIds = [
            ...new Set(
                rows.flatMap((r) =>
                    [
                        r.requestedByResponsibleId,
                        r.authorizedResponsibleId,
                    ].filter((id): id is string => Boolean(id)),
                ),
            ),
        ];

        let cancelled = false;

        void (async () => {
            const [studentResults, responsibleResults] = await Promise.all([
                Promise.all(
                    studentIds.map((id) => getStudentByIdAction(clientId, id)),
                ),
                Promise.all(
                    responsibleIds.map((id) =>
                        getResponsibleByIdAction(clientId, id),
                    ),
                ),
            ]);

            if (cancelled) return;

            const nextStudents = new Map<string, StudentRow>();
            for (const r of studentResults) {
                if ("success" in r) nextStudents.set(r.student.id, r.student);
            }

            const nextResponsibles = new Map<string, ResponsibleRow>();
            for (const r of responsibleResults) {
                if ("success" in r) {
                    nextResponsibles.set(r.responsible.id, r.responsible);
                }
            }

            setStudentById(nextStudents);
            setResponsibleById(nextResponsibles);
        })();

        return () => {
            cancelled = true;
        };
    }, [clientId, rows]);

    function refresh() {
        startTransition(() => router.refresh());
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-medium">Autorizações temporárias de retirada</p>
                    <p className="text-muted-foreground text-sm max-w-2xl">
                        Criadas pelos responsáveis no app. A portaria pode marcar
                        como utilizadas; a escola pode cancelar.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => refresh()}
                >
                    Atualizar
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Aluno</TableHead>
                            <TableHead>Solicitante</TableHead>
                            <TableHead>Quem retira</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground text-center py-10"
                                >
                                    Nenhuma autorização cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => {
                                const student = studentById.get(row.studentId);
                                const requester = responsibleById.get(
                                    row.requestedByResponsibleId,
                                );
                                const picker = row.authorizedResponsibleId
                                    ? responsibleById.get(
                                          row.authorizedResponsibleId,
                                      )?.name ??
                                      `Responsável ${row.authorizedResponsibleId.slice(
                                          0,
                                          8,
                                      )}…`
                                    : [
                                          row.guestName,
                                          row.guestDocument,
                                          row.guestPhone,
                                      ]
                                          .filter(
                                              (p): p is string =>
                                                  typeof p === "string" &&
                                                  p.trim().length > 0,
                                          )
                                          .join(" · ");

                                const canAct = row.effectiveStatus === "active";

                                return (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium">
                                            {student?.name ?? row.studentId}
                                        </TableCell>
                                        <TableCell>
                                            {requester?.name ??
                                                row.requestedByResponsibleId}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] break-words text-sm">
                                            {picker}
                                        </TableCell>
                                        <TableCell className="whitespace-normal text-xs sm:text-sm">
                                            {formatRange(
                                                row.validFrom,
                                                row.validUntil,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={statusVariant(
                                                    row.effectiveStatus,
                                                )}
                                            >
                                                {statusLabel(row.effectiveStatus)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-y-2 sm:space-y-1">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={!canAct || isPending}
                                                    onClick={() => {
                                                        startTransition(
                                                            async () => {
                                                                const r =
                                                                    await markUsedPickupAuthorizationAction(
                                                                        clientId,
                                                                        row.id,
                                                                    );
                                                                if ("error" in r) {
                                                                    toast.error(
                                                                        r.error,
                                                                    );
                                                                    return;
                                                                }
                                                                toast.success(
                                                                    "Marcada como utilizada.",
                                                                );
                                                                refresh();
                                                            },
                                                        );
                                                    }}
                                                >
                                                    Marcar uso
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!canAct || isPending}
                                                    onClick={() => {
                                                        startTransition(
                                                            async () => {
                                                                const r =
                                                                    await cancelPickupAuthorizationAction(
                                                                        clientId,
                                                                        row.id,
                                                                    );
                                                                if ("error" in r) {
                                                                    toast.error(
                                                                        r.error,
                                                                    );
                                                                    return;
                                                                }
                                                                toast.success(
                                                                    "Cancelada.",
                                                                );
                                                                refresh();
                                                            },
                                                        );
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
