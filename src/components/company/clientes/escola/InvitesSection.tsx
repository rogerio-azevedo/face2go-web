"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    cancelInviteAction,
    deleteInviteAction,
    markUsedInviteAction,
} from "@/app/company/clientes/[clientId]/usuarios/invites-actions";
import { deferInEffect } from "@/lib/defer-in-effect";
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
import type { InviteRow, InviteStatus } from "@/types/domain";

function statusLabel(status: InviteStatus): string {
    switch (status) {
        case "active":
            return "Ativo";
        case "used":
            return "Utilizado";
        case "expired":
            return "Expirado";
        case "cancelled":
            return "Cancelado";
        default:
            return status;
    }
}

function statusVariant(
    status: InviteStatus,
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
    status: InviteRow["guestApprovalStatus"],
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

export function InvitesSection({
    clientId,
    initialInvites,
}: {
    clientId: string;
    initialInvites: InviteRow[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [rows, setRows] = useState<InviteRow[]>(initialInvites);
    const [selectedRow, setSelectedRow] = useState<InviteRow | null>(null);
    const [searchGuest, setSearchGuest] = useState("");
    const [searchCreator, setSearchCreator] = useState("");

    const filteredRows = useMemo(() => {
        const guestTerm = searchGuest.trim().toLowerCase();
        const creatorTerm = searchCreator.trim().toLowerCase();
        const guestDigits = searchGuest.replace(/\D/g, "");

        return rows.filter((row) => {
            const guestName = row.guestName?.toLowerCase() ?? "";
            const guestDocument = row.guestDocument?.replace(/\D/g, "") ?? "";
            const guestMatch =
                !guestTerm ||
                guestName.includes(guestTerm) ||
                (guestDigits.length >= 3 &&
                    guestDocument.includes(guestDigits));
            const creatorName =
                row.requestedByMemberName?.toLowerCase() ?? "";
            const creatorMatch =
                !creatorTerm || creatorName.includes(creatorTerm);

            return guestMatch && creatorMatch;
        });
    }, [rows, searchGuest, searchCreator]);

    useEffect(() => {
        deferInEffect(() => {
            setRows(initialInvites);
        });
    }, [initialInvites]);

    function refresh() {
        startTransition(() => router.refresh());
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="font-medium">Convites de visitantes</p>
                    <p className="text-sm text-muted-foreground">
                        Cadastros temporários criados por funcionários da escola.
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

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
                    <Label htmlFor="search-invite-guest" className="text-muted-foreground">
                        Visitante
                    </Label>
                    <SearchInput
                        id="search-invite-guest"
                        value={searchGuest}
                        onValueChange={setSearchGuest}
                        placeholder="Filtrar por visitante…"
                        className="sm:max-w-sm"
                    />
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1">
                    <Label htmlFor="search-invite-creator" className="text-muted-foreground">
                        Criado por
                    </Label>
                    <SearchInput
                        id="search-invite-creator"
                        value={searchCreator}
                        onValueChange={setSearchCreator}
                        placeholder="Filtrar por criador…"
                        className="sm:max-w-sm"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Visitante</TableHead>
                            <TableHead>Criado por</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-muted-foreground text-center py-10"
                                >
                                    {rows.length === 0
                                        ? "Nenhum convite cadastrado."
                                        : "Nenhum convite encontrado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((row) => {
                                const guestLabel = [row.guestName, row.guestDocument]
                                    .filter(Boolean)
                                    .join(" · ");
                                const canDelete =
                                    row.effectiveStatus === "cancelled" ||
                                    row.effectiveStatus === "expired" ||
                                    row.effectiveStatus === "used";

                                return (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium max-w-[200px] break-words">
                                            {guestLabel || "—"}
                                        </TableCell>
                                        <TableCell>
                                            {row.requestedByMemberName ??
                                                row.requestedByMemberId}
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
                                                                        await deleteInviteAction(
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
                                                                        "Convite excluído.",
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
                open={selectedRow != null}
                onOpenChange={(open) => {
                    if (!open) setSelectedRow(null);
                }}
            >
                <SheetContent className="overflow-y-auto sm:max-w-md">
                    {selectedRow ? (
                        <>
                            <SheetHeader>
                                <SheetTitle>Detalhes do convite</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Visitante</p>
                                    <p className="font-medium">
                                        {selectedRow.guestName ?? "—"}
                                    </p>
                                    {selectedRow.guestDocument ? (
                                        <p>{selectedRow.guestDocument}</p>
                                    ) : null}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Criado por</p>
                                    <p>
                                        {selectedRow.requestedByMemberName ??
                                            selectedRow.requestedByMemberId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Validade</p>
                                    <p>
                                        {formatRange(
                                            selectedRow.validFrom,
                                            selectedRow.validUntil,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge
                                        variant={statusVariant(
                                            selectedRow.effectiveStatus,
                                        )}
                                    >
                                        {statusLabel(selectedRow.effectiveStatus)}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Face</p>
                                    <p>
                                        {guestApprovalLabel(
                                            selectedRow.guestApprovalStatus,
                                        )}
                                    </p>
                                </div>
                                {selectedRow.vehicle ? (
                                    <div>
                                        <p className="text-muted-foreground">Veículo</p>
                                        <p>
                                            {selectedRow.vehicle.plate} —{" "}
                                            {selectedRow.vehicle.brand}{" "}
                                            {selectedRow.vehicle.model}
                                        </p>
                                    </div>
                                ) : null}
                                {selectedRow.notes ? (
                                    <div>
                                        <p className="text-muted-foreground">Observações</p>
                                        <p>{selectedRow.notes}</p>
                                    </div>
                                ) : null}

                                {selectedRow.effectiveStatus === "active" ? (
                                    <div className="flex flex-col gap-2 pt-2">
                                        <Button
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => {
                                                startTransition(async () => {
                                                    const r =
                                                        await markUsedInviteAction(
                                                            clientId,
                                                            selectedRow.id,
                                                        );
                                                    if ("error" in r) {
                                                        toast.error(r.error);
                                                        return;
                                                    }
                                                    toast.success(
                                                        "Convite marcado como utilizado.",
                                                    );
                                                    setSelectedRow(null);
                                                    refresh();
                                                });
                                            }}
                                        >
                                            Marcar como utilizado
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            disabled={isPending}
                                            onClick={() => {
                                                startTransition(async () => {
                                                    const r =
                                                        await cancelInviteAction(
                                                            clientId,
                                                            selectedRow.id,
                                                        );
                                                    if ("error" in r) {
                                                        toast.error(r.error);
                                                        return;
                                                    }
                                                    toast.success(
                                                        "Convite cancelado.",
                                                    );
                                                    setSelectedRow(null);
                                                    refresh();
                                                });
                                            }}
                                        >
                                            Cancelar convite
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
