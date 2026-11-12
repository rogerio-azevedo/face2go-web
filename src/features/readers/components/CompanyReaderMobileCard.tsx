"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConnectionBadge } from "@/features/readers/components/ConnectionBadge";
import { ReaderDetailsDialog } from "@/features/readers/components/ReaderDetailsDialog";
import { ReaderHoldOpenSwitch } from "@/features/readers/components/ReaderHoldOpenSwitch";
import { ReaderOpenDoorButton } from "@/features/readers/components/ReaderOpenDoorButton";
import {
    READER_BRAND_LABELS,
    READER_DIRECTION_LABELS,
    type ReaderBrandSlug,
    type ReaderDirectionSlug,
} from "@/lib/validations/readers";
import { cn } from "@/lib/utils";
import type {
    ReaderListRow,
    ReaderMonitorDeviceApiRow,
} from "@/types/domain";

type CompanyReaderMobileCardProps = {
    reader: ReaderListRow;
    canManage: boolean;
    monitorLoading: boolean;
    monitorDevice: ReaderMonitorDeviceApiRow | undefined;
    onOpenEdit: (reader: ReaderListRow) => void;
};

export function CompanyReaderMobileCard({
    reader,
    canManage,
    monitorLoading,
    monitorDevice,
    onOpenEdit,
}: CompanyReaderMobileCardProps) {
    const nameId = `reader-${reader.id}-name`;
    const direction = reader.direction
        ? READER_DIRECTION_LABELS[reader.direction as ReaderDirectionSlug]
        : null;
    const brand =
        READER_BRAND_LABELS[reader.brand as ReaderBrandSlug] ?? reader.brand;
    const showUsers =
        reader.brand === "intelbras" || reader.brand === "hikvision";
    const inactive = !reader.isActive;

    return (
        <article
            aria-labelledby={nameId}
            title={inactive ? "Leitor inativo" : undefined}
            className="bg-card rounded-lg border p-4 shadow-xs"
        >
            <div className="min-w-0">
                <p
                    className={cn(
                        "text-xs font-medium",
                        inactive
                            ? "text-destructive"
                            : "text-muted-foreground",
                    )}
                >
                    {reader.clientName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2
                        id={nameId}
                        className={cn(
                            "font-semibold break-words",
                            inactive ? "text-destructive" : "text-foreground",
                        )}
                    >
                        {reader.name}
                    </h2>
                    {reader.minimumAccessAge != null ? (
                        <Badge
                            variant="outline"
                            className="border-orange-300 bg-orange-100 font-semibold text-orange-900 hover:bg-orange-100"
                            title={`Só sincroniza pessoas com data válida e ${reader.minimumAccessAge} anos ou mais`}
                        >
                            {reader.minimumAccessAge}+
                        </Badge>
                    ) : null}
                </div>
                {reader.agePolicyStatus === "pending" ? (
                    <span
                        className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs"
                        title="Aplicando a política no equipamento"
                    >
                        <Loader2 className="size-3.5 animate-spin" />
                        Aplicando política
                    </span>
                ) : null}
                {reader.agePolicyStatus === "failed" ? (
                    <span
                        className="text-destructive mt-1 inline-flex items-center gap-1 text-xs font-medium"
                        title={
                            reader.agePolicyError ??
                            "Falha ao aplicar a política no equipamento"
                        }
                    >
                        <AlertTriangle className="size-3.5" />
                        Falha na política
                    </span>
                ) : null}
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 border-y py-3 text-sm">
                <div className="min-w-0">
                    <dt className="text-muted-foreground text-xs">Marca</dt>
                    <dd className="mt-1">
                        <Badge variant="outline">{brand}</Badge>
                    </dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-muted-foreground text-xs">Conexão</dt>
                    <dd className="mt-1">
                        <ConnectionBadge
                            device={monitorDevice}
                            loading={monitorLoading}
                            connectionMode={reader.connectionMode}
                        />
                    </dd>
                </div>
                <div className="min-w-0">
                    <dt className="text-muted-foreground text-xs">Direção</dt>
                    <dd className="mt-1">
                        {direction ? (
                            <Badge variant="outline">{direction}</Badge>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </dd>
                </div>
            </dl>

            <div className="mt-4 space-y-2">
                {canManage ? (
                    <div className="flex items-center gap-3">
                        <ReaderOpenDoorButton
                            readerId={reader.id}
                            readerName={reader.name}
                            disabled={!reader.isActive}
                            variant="company"
                            label="Abrir porta"
                            size="lg"
                            className="min-w-0 flex-1"
                        />
                        <ReaderHoldOpenSwitch
                            readerId={reader.id}
                            readerName={reader.name}
                            heldOpen={reader.doorHoldOpen === true}
                            heldOpenAt={reader.doorHoldOpenedAt}
                            heldOpenByName={reader.doorHoldOpenedByName}
                            disabled={!reader.isActive}
                            variant="company"
                        />
                    </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                    <ReaderDetailsDialog
                        readerId={reader.id}
                        readerName={reader.name}
                        endpoint={`${reader.ip}:${reader.port}`}
                        model={reader.model}
                        serialNumber={reader.serialNumber}
                        firmwareVersion={reader.firmwareVersion}
                        syncedAt={reader.deviceInfoSyncedAt}
                        lastError={reader.deviceInfoLastError}
                        triggerLabel="Detalhes"
                        triggerVariant="outline"
                        triggerClassName="w-full"
                    />
                    {canManage && showUsers ? (
                        <Link
                            href={`/company/leitores/${reader.id}/device-users`}
                            aria-label={`Gerenciar usuários do leitor ${reader.name}`}
                            className={cn(
                                buttonVariants({ variant: "outline", size: "lg" }),
                                "w-full",
                            )}
                        >
                            Usuários
                        </Link>
                    ) : null}
                    {canManage ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className={cn(!showUsers && "col-span-2")}
                            aria-label={`Editar leitor ${reader.name}`}
                            onClick={() => onOpenEdit(reader)}
                        >
                            Editar
                        </Button>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
