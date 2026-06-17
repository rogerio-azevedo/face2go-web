"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    cancelPickupAuthorizationAction,
    deletePickupAuthorizationAction,
    getResponsibleByIdAction,
    markUsedPickupAuthorizationAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import { normalizeSearch } from "@/lib/utils/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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

function guestApprovalLabel(
    status: PickupAuthorizationRow["guestApprovalStatus"],
): string {
    switch (status) {
        case "pending_face":
            return "Aguardando foto";
        case "submitted":
            return "Foto enviada";
        case "approved":
            return "Face aprovada";
        case "rejected":
            return "Face recusada";
        default:
            return status;
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
    const [responsibleById, setResponsibleById] = useState(
        () => new Map<string, ResponsibleRow>(),
    );
    const [selectedRow, setSelectedRow] = useState<PickupAuthorizationRow | null>(
        null,
    );
    const [searchStudent, setSearchStudent] = useState("");
    const [searchRequester, setSearchRequester] = useState("");

    const filteredRows = useMemo(() => {
        const studentTerm = normalizeSearch(searchStudent);
        const requesterTerm = normalizeSearch(searchRequester);

        return rows.filter((row) => {
            const studentMatch =
                !studentTerm ||
                row.students.some((student) =>
                    normalizeSearch(student.name).includes(studentTerm),
                );
            const requester = responsibleById.get(row.requestedByResponsibleId);
            const requesterName = requester?.name ?? "";
            const requesterMatch =
                !requesterTerm ||
                normalizeSearch(requesterName).includes(requesterTerm);

            return studentMatch && requesterMatch;
        });
    }, [rows, searchStudent, searchRequester, responsibleById]);

    useEffect(() => {
        deferInEffect(() => {
            setRows(initialAuthorizations);
        });
    }, [initialAuthorizations]);

    useEffect(() => {
        let cancelled = false;

        deferInEffect(() => {
            if (rows.length === 0) {
                setResponsibleById(new Map());
                return;
            }

            const responsibleIds = [
                ...new Set(
                    rows.flatMap((r) =>
                        [r.requestedByResponsibleId, r.linkedResponsibleId].filter(
                            (id): id is string => Boolean(id),
                        ),
                    ),
                ),
            ];

            void (async () => {
                const responsibleResults = await Promise.all(
                    responsibleIds.map((id) =>
                        getResponsibleByIdAction(clientId, id),
                    ),
                );

                if (cancelled) return;

                const nextResponsibles = new Map<string, ResponsibleRow>();
                for (const r of responsibleResults) {
                    if ("success" in r) {
                        nextResponsibles.set(r.responsible.id, r.responsible);
                    }
                }

                setResponsibleById(nextResponsibles);
            })();
        });

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

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
                    <Label htmlFor="search-pickup-student" className="text-muted-foreground">
                        Aluno
                    </Label>
                    <SearchInput
                        id="search-pickup-student"
                        value={searchStudent}
                        onValueChange={setSearchStudent}
                        placeholder="Filtrar por aluno…"
                        className="sm:max-w-sm"
                    />
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
                    <Label htmlFor="search-pickup-requester" className="text-muted-foreground">
                        Solicitante
                    </Label>
                    <SearchInput
                        id="search-pickup-requester"
                        value={searchRequester}
                        onValueChange={setSearchRequester}
                        placeholder="Filtrar por solicitante…"
                        className="sm:max-w-sm"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Aluno(s)</TableHead>
                            <TableHead>Solicitante</TableHead>
                            <TableHead>Quem retira</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground text-center py-10"
                                >
                                    {rows.length === 0
                                        ? "Nenhuma autorização cadastrada."
                                        : "Nenhuma autorização encontrada."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((row) => {
                                const requester = responsibleById.get(
                                    row.requestedByResponsibleId,
                                );
                                const picker = [
                                    row.guestName,
                                    row.guestDocument,
                                ]
                                    .filter(Boolean)
                                    .join(" · ");
                                const studentNames = row.students
                                    .map((s) => s.name)
                                    .join(", ");
                                const canDelete =
                                    row.effectiveStatus === "cancelled" ||
                                    row.effectiveStatus === "expired" ||
                                    row.effectiveStatus === "used";

                                return (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium max-w-[180px]">
                                            {studentNames || "—"}
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
                                        <TableCell className="text-right">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSelectedRow(row)
                                                    }
                                                >
                                                    Detalhes
                                                </Button>
                                                {canDelete ? (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        disabled={isPending}
                                                        onClick={() => {
                                                            startTransition(
                                                                async () => {
                                                                    const r =
                                                                        await deletePickupAuthorizationAction(
                                                                            clientId,
                                                                            row.id,
                                                                        );
                                                                    if (
                                                                        "error" in
                                                                        r
                                                                    ) {
                                                                        toast.error(
                                                                            r.error,
                                                                        );
                                                                        return;
                                                                    }
                                                                    toast.success(
                                                                        "Autorização excluída.",
                                                                    );
                                                                    refresh();
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Excluir
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet
                open={selectedRow !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedRow(null);
                }}
            >
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    {selectedRow ? (
                        <>
                            <SheetHeader>
                                <SheetTitle>Detalhes da autorização</SheetTitle>
                            </SheetHeader>
                            <div className="space-y-4 px-4 pb-6 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium">
                                        Aluno(s)
                                    </p>
                                    <p className="font-medium">
                                        {selectedRow.students
                                            .map((s) => s.name)
                                            .join(", ") || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium">
                                        Retirante
                                    </p>
                                    <p>
                                        {[
                                            selectedRow.guestName,
                                            selectedRow.guestDocument,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                    {selectedRow.linkedResponsibleName ? (
                                        <p className="text-muted-foreground mt-1">
                                            Responsável cadastrado:{" "}
                                            {selectedRow.linkedResponsibleName}
                                        </p>
                                    ) : null}
                                </div>
                                {selectedRow.guestPhone ? (
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium">
                                            Telefone
                                        </p>
                                        <p>{selectedRow.guestPhone}</p>
                                    </div>
                                ) : null}
                                {selectedRow.vehicle ? (
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium">
                                            Veículo
                                        </p>
                                        <p>
                                            {selectedRow.vehicle.plate} —{" "}
                                            {selectedRow.vehicle.brand}{" "}
                                            {selectedRow.vehicle.model}
                                        </p>
                                    </div>
                                ) : null}
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium">
                                        Validade
                                    </p>
                                    <p>
                                        {formatRange(
                                            selectedRow.validFrom,
                                            selectedRow.validUntil,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium">
                                        Status
                                    </p>
                                    <Badge
                                        variant={statusVariant(
                                            selectedRow.effectiveStatus,
                                        )}
                                    >
                                        {statusLabel(selectedRow.effectiveStatus)}
                                    </Badge>
                                    <p className="text-muted-foreground mt-2">
                                        Face:{" "}
                                        {guestApprovalLabel(
                                            selectedRow.guestApprovalStatus,
                                        )}
                                    </p>
                                </div>
                                {selectedRow.notes ? (
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium">
                                            Observações
                                        </p>
                                        <p>{selectedRow.notes}</p>
                                    </div>
                                ) : null}
                                {selectedRow.guestRegistrationUrl ? (
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium">
                                            Link de cadastro
                                        </p>
                                        <p className="break-all text-xs">
                                            {selectedRow.guestRegistrationUrl}
                                        </p>
                                    </div>
                                ) : null}

                                {selectedRow.effectiveStatus === "active" ? (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            disabled={isPending}
                                            onClick={() => {
                                                startTransition(async () => {
                                                    const r =
                                                        await markUsedPickupAuthorizationAction(
                                                            clientId,
                                                            selectedRow.id,
                                                        );
                                                    if ("error" in r) {
                                                        toast.error(r.error);
                                                        return;
                                                    }
                                                    toast.success(
                                                        "Marcada como utilizada.",
                                                    );
                                                    setSelectedRow(null);
                                                    refresh();
                                                });
                                            }}
                                        >
                                            Marcar uso
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={isPending}
                                            onClick={() => {
                                                startTransition(async () => {
                                                    const r =
                                                        await cancelPickupAuthorizationAction(
                                                            clientId,
                                                            selectedRow.id,
                                                        );
                                                    if ("error" in r) {
                                                        toast.error(r.error);
                                                        return;
                                                    }
                                                    toast.success("Cancelada.");
                                                    setSelectedRow(null);
                                                    refresh();
                                                });
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    );
}
