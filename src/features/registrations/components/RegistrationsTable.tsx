"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";

import { RegistrationRowActions } from "@/features/registrations/components/RegistrationRowActions";
import {
    extraSummary,
    formatBirthDate,
    formatWhen,
    type RegistrationListTab,
    type RegistrationSortDir,
    type RegistrationSortField,
} from "@/features/registrations/lib/registration-format";
import { DeviceSyncStatusBadge } from "@/components/company/clientes/escola/DeviceSyncStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaceCirclePhoto } from "@/components/ui/face-circle-photo";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCpfOrCnpj } from "@/lib/utils/document";
import type { ClientRegistrationListRow } from "@/types/domain";

export type RegistrationListActionProps = {
    isAdmin: boolean;
    busy: boolean;
    syncingId: string | null;
    retakeBusyId: string | null;
    onView: (row: ClientRegistrationListRow) => void;
    onHistory: (row: ClientRegistrationListRow) => void;
    onSync: (row: ClientRegistrationListRow) => void;
    onForceSync: (row: ClientRegistrationListRow) => void;
    onAllowSimilarFace: (row: ClientRegistrationListRow) => void;
    onEdit: (row: ClientRegistrationListRow) => void;
    onRetake: (row: ClientRegistrationListRow) => void;
    onReject: (row: ClientRegistrationListRow) => void;
    onDelete: (row: ClientRegistrationListRow) => Promise<void>;
    onRestore: (row: ClientRegistrationListRow) => Promise<void>;
};

type RegistrationsTableProps = RegistrationListActionProps & {
    rows: ClientRegistrationListRow[];
    tab: RegistrationListTab;
    sortField: RegistrationSortField;
    sortDir: RegistrationSortDir;
    onToggleSort: (field: RegistrationSortField) => void;
    isFetching: boolean;
};

function SortableHead({
    label,
    active,
    dir,
    onClick,
    className,
}: {
    label: string;
    active: boolean;
    dir: RegistrationSortDir;
    onClick: () => void;
    className?: string;
}) {
    const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
        <TableHead className={className}>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 gap-1 px-2 font-medium"
                onClick={onClick}
                aria-sort={
                    active ? (dir === "asc" ? "ascending" : "descending") : "none"
                }
            >
                {label}
                <Icon className="size-3.5 opacity-60" aria-hidden />
            </Button>
        </TableHead>
    );
}

export function RegistrationsTable({
    rows,
    tab,
    sortField,
    sortDir,
    onToggleSort,
    isFetching,
    isAdmin,
    busy,
    syncingId,
    retakeBusyId,
    onView,
    onHistory,
    onSync,
    onForceSync,
    onAllowSimilarFace,
    onEdit,
    onRetake,
    onReject,
    onDelete,
    onRestore,
}: RegistrationsTableProps) {
    return (
        <div className="relative hidden rounded-md border md:block">
            {isFetching ? (
                <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center rounded-md">
                    <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
            ) : null}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-13" aria-label="Foto" />
                        <SortableHead
                            label="Nome"
                            active={sortField === "name"}
                            dir={sortDir}
                            onClick={() => onToggleSort("name")}
                        />
                        <TableHead>CPF</TableHead>
                        <TableHead>Nascimento</TableHead>
                        <TableHead>Idade</TableHead>
                        <SortableHead
                            label="Local"
                            active={sortField === "local"}
                            dir={sortDir}
                            onClick={() => onToggleSort("local")}
                        />
                        <TableHead>Link</TableHead>
                        <SortableHead
                            label="Enviado"
                            active={sortField === "submittedAt"}
                            dir={sortDir}
                            onClick={() => onToggleSort("submittedAt")}
                        />
                        <TableHead className="w-25 text-right">
                            Ações
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={9}
                                className="text-muted-foreground py-10 text-center"
                            >
                                Nenhum registro nesta lista.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className={
                                    tab === "deleted"
                                        ? "text-muted-foreground"
                                        : undefined
                                }
                            >
                                <TableCell className="align-middle">
                                    <div className="size-8 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                                        <FaceCirclePhoto
                                            className="size-full"
                                            photoUrl={row.faceUrl ?? null}
                                            nameHint={row.name ?? null}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col gap-1">
                                        <span className="flex flex-wrap items-center gap-1.5">
                                            {row.name ?? "—"}
                                            {row.isMinor ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-orange-300 bg-orange-100 font-semibold text-orange-900 hover:bg-orange-100"
                                                    title="Menor de 18 anos"
                                                >
                                                    Menor
                                                </Badge>
                                            ) : null}
                                            {tab === "deleted" ? (
                                                <Badge variant="secondary">
                                                    Excluído
                                                </Badge>
                                            ) : null}
                                        </span>
                                        {(tab === "approved" ||
                                            tab === "blocked") &&
                                        row.faceId != null &&
                                        row.hasFacialReaders ? (
                                            <div className="flex flex-wrap items-center gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px]"
                                                >
                                                    ID leitor {row.faceId}
                                                </Badge>
                                                <DeviceSyncStatusBadge
                                                    status={row.deviceSyncStatus}
                                                    hasFace={row.faceId != null}
                                                    hasReaders={
                                                        row.hasFacialReaders
                                                    }
                                                    error={row.deviceSyncError}
                                                    syncedCount={
                                                        row.readerSyncSynced
                                                    }
                                                    totalCount={
                                                        row.readerSyncTotal
                                                    }
                                                    isMinor={row.isMinor}
                                                />
                                            </div>
                                        ) : null}
                                        {tab === "approved" &&
                                        row.faceId == null &&
                                        !row.hasFacePhoto ? (
                                            <span className="text-muted-foreground text-[10px]">
                                                Sem foto (não há envio ao leitor)
                                            </span>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {row.document
                                        ? formatCpfOrCnpj(row.document)
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {formatBirthDate(row.birthDate)}
                                </TableCell>
                                <TableCell className="text-xs font-medium tabular-nums">
                                    {row.age == null ? "—" : `${row.age} anos`}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {extraSummary(row)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {row.registrationLinkCode ?? "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {formatWhen(row.submittedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <RegistrationRowActions
                                        row={row}
                                        tab={tab}
                                        isAdmin={isAdmin}
                                        busy={
                                            busy ||
                                            syncingId === row.id ||
                                            retakeBusyId === row.id
                                        }
                                        onView={() => onView(row)}
                                        onHistory={() => onHistory(row)}
                                        onSync={() => onSync(row)}
                                        onForceSync={() => onForceSync(row)}
                                        onAllowSimilarFace={() =>
                                            onAllowSimilarFace(row)
                                        }
                                        onEdit={() => onEdit(row)}
                                        onRetake={() => onRetake(row)}
                                        onReject={() => onReject(row)}
                                        onDelete={() => onDelete(row)}
                                        onRestore={() => onRestore(row)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
