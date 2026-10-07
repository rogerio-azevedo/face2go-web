"use client";

import { RegistrationRowActions } from "@/features/registrations/components/RegistrationRowActions";
import type { RegistrationListActionProps } from "@/features/registrations/components/RegistrationsTable";
import {
    extraSummary,
    formatRelativeWhen,
    type RegistrationListTab,
} from "@/features/registrations/lib/registration-format";
import { DeviceSyncStatusBadge } from "@/components/company/clientes/escola/DeviceSyncStatusBadge";
import { Badge } from "@/components/ui/badge";
import { FaceCirclePhoto } from "@/components/ui/face-circle-photo";
import { formatCpfOrCnpj } from "@/lib/utils/document";
import type { ClientRegistrationListRow } from "@/types/domain";

type RegistrationMobileCardProps = {
    row: ClientRegistrationListRow;
    tab: RegistrationListTab;
    actions: RegistrationListActionProps;
};

export function RegistrationMobileCard({
    row,
    tab,
    actions,
}: RegistrationMobileCardProps) {
    const showSync =
        (tab === "approved" || tab === "blocked") &&
        row.faceId != null &&
        row.hasFacialReaders;
    const document = row.document ? formatCpfOrCnpj(row.document) : null;
    const local = extraSummary(row);

    return (
        <div
            className={
                tab === "deleted"
                    ? "flex items-start gap-3 border-b py-3 text-muted-foreground"
                    : "flex items-start gap-3 border-b py-3"
            }
        >
            <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                onClick={() => actions.onView(row)}
            >
                <div className="size-12 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                    <FaceCirclePhoto
                        className="size-full"
                        photoUrl={row.faceUrl ?? null}
                        nameHint={row.name ?? null}
                    />
                </div>
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{row.name ?? "—"}</span>
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
                            <Badge variant="secondary">Excluído</Badge>
                        ) : null}
                    </span>
                    {showSync ? (
                        <span className="mt-1 flex flex-wrap items-center gap-1">
                            <Badge variant="outline" className="text-[10px]">
                                ID leitor {row.faceId}
                            </Badge>
                            <DeviceSyncStatusBadge
                                status={row.deviceSyncStatus}
                                hasFace={row.faceId != null}
                                hasReaders={row.hasFacialReaders}
                                error={row.deviceSyncError}
                                syncedCount={row.readerSyncSynced}
                                totalCount={row.readerSyncTotal}
                                isMinor={row.isMinor}
                            />
                        </span>
                    ) : null}
                    <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                        {row.age != null ? `${row.age} anos` : null}
                        {row.age != null && (local !== "—" || document)
                            ? " · "
                            : null}
                        {local !== "—" ? local : null}
                        {local !== "—" && document ? " · " : null}
                        {document}
                        {row.age == null && local === "—" && !document
                            ? "—"
                            : null}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                        Enviado {formatRelativeWhen(row.submittedAt)}
                    </span>
                </span>
            </button>
            <RegistrationRowActions
                row={row}
                tab={tab}
                isAdmin={actions.isAdmin}
                busy={
                    actions.busy ||
                    actions.syncingId === row.id ||
                    actions.retakeBusyId === row.id
                }
                onView={() => actions.onView(row)}
                onHistory={() => actions.onHistory(row)}
                onSync={() => actions.onSync(row)}
                onForceSync={() => actions.onForceSync(row)}
                onAllowSimilarFace={() => actions.onAllowSimilarFace(row)}
                onEdit={() => actions.onEdit(row)}
                onRetake={() => actions.onRetake(row)}
                onDelete={() => actions.onDelete(row)}
                onRestore={() => actions.onRestore(row)}
            />
        </div>
    );
}
