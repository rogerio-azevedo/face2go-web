"use client";

import {
    Camera,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    MoreHorizontal,
    Pencil,
    Phone,
    RotateCcw,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { getClientRegistrationFaceUrlAction } from "@/app/client/cadastros/actions";
import { getCompanyRegistrationFaceUrlAction } from "@/app/company/clientes/[clientId]/usuarios/actions";
import { DeviceSyncStatusBadge } from "@/components/company/clientes/escola/DeviceSyncStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useRegistrationEvents } from "@/features/registrations/hooks/use-registration-events";
import { REGISTRATION_EVENT_META } from "@/features/registrations/lib/registration-event-meta";
import {
    extraSummary,
    formatBirthDate,
    formatWhen,
    registrationStatusLabel,
    toBrazilContactNumber,
} from "@/features/registrations/lib/registration-format";
import { formatCpfOrCnpj } from "@/lib/utils/document";
import type { ClientRegistrationListRow } from "@/types/domain";

type RegistrationDetailSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: ClientRegistrationListRow | null;
    index: number;
    total: number;
    variant: "client" | "company";
    companyClientId?: string;
    pending: boolean;
    syncing: boolean;
    retakeBusy: boolean;
    onPrev: () => void;
    onNext: () => void;
    onApprove: () => void;
    onReject: () => void;
    onBlock: () => void;
    onUnblock: () => void;
    onEdit: () => void;
    onRetake: () => void;
    onSync: () => void;
    onForceSync: () => void;
    onHistory: () => void;
};

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3 border-b py-2.5 text-sm">
            <dt className="text-muted-foreground shrink-0">{label}</dt>
            <dd className="min-w-0 text-right font-medium">{children}</dd>
        </div>
    );
}

export function RegistrationDetailSheet({
    open,
    onOpenChange,
    row,
    index,
    total,
    variant,
    companyClientId,
    pending,
    syncing,
    retakeBusy,
    onPrev,
    onNext,
    onApprove,
    onReject,
    onBlock,
    onUnblock,
    onEdit,
    onRetake,
    onSync,
    onForceSync,
    onHistory,
}: RegistrationDetailSheetProps) {
    const [fetchedFace, setFetchedFace] = useState<{
        id: string;
        url: string;
    } | null>(null);
    const [photoOpen, setPhotoOpen] = useState(false);
    const eventsQuery = useRegistrationEvents({
        variant,
        companyClientId,
        registrationId: row?.id ?? null,
        enabled: open && row != null,
    });
    const latest = eventsQuery.data?.[0];
    const latestMeta = latest ? REGISTRATION_EVENT_META[latest.type] : null;

    useEffect(() => {
        const registrationId = row?.id;
        if (!open || !registrationId || !row?.hasFacePhoto) return;
        let cancelled = false;
        void (async () => {
            const result =
                variant === "client"
                    ? await getClientRegistrationFaceUrlAction(registrationId)
                    : companyClientId
                      ? await getCompanyRegistrationFaceUrlAction(
                            companyClientId,
                            registrationId,
                        )
                      : { error: "Cliente inválido." };
            if (cancelled) return;
            if ("url" in result) {
                setFetchedFace({ id: registrationId, url: result.url });
            } else toast.error(result.error);
        })();
        return () => {
            cancelled = true;
        };
    }, [companyClientId, open, row?.hasFacePhoto, row?.id, variant]);

    const photo =
        fetchedFace && fetchedFace.id === row?.id
            ? fetchedFace.url
            : (row?.faceUrl ?? null);
    const contact = toBrazilContactNumber(row?.phone ?? null);
    const deleted = row?.isActive === false;
    const canEdit = !!row && !deleted;
    const canRetake =
        canEdit &&
        (row.status === "draft" ||
            row.status === "rejected" ||
            row.status === "approved");
    const canSync =
        !!row &&
        !deleted &&
        (row.status === "approved" || row.status === "blocked") &&
        row.faceId != null &&
        row.hasFacialReaders;
    const position =
        index >= 0 && total > 0 ? `${index + 1} de ${total}` : null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="h-dvh w-full gap-0 data-[side=right]:h-dvh data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:border-l-0 data-[side=right]:sm:max-w-xl data-[side=right]:sm:border-l"
                >
                    <SheetHeader className="shrink-0 border-b">
                        <div className="flex items-start gap-2 pr-8">
                            <div className="min-w-0 flex-1">
                                <SheetTitle className="truncate">
                                    {row?.name ?? "Cadastro"}
                                </SheetTitle>
                                <SheetDescription>
                                    {position ?? "Detalhe do cadastro"}
                                </SheetDescription>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Anterior"
                                    disabled={pending || index <= 0}
                                    onClick={onPrev}
                                >
                                    <ChevronLeft />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Próximo"
                                    disabled={
                                        pending || index < 0 || index >= total - 1
                                    }
                                    onClick={onNext}
                                >
                                    <ChevronRight />
                                </Button>
                                {canEdit || canRetake || canSync ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="Mais ações"
                                                    disabled={pending || retakeBusy}
                                                >
                                                    <MoreHorizontal />
                                                </Button>
                                            }
                                        />
                                        <DropdownMenuContent align="end">
                                            {canRetake ? (
                                                <DropdownMenuItem onClick={onRetake}>
                                                    <Camera />
                                                    Refazer foto
                                                </DropdownMenuItem>
                                            ) : null}
                                            {canEdit ? (
                                                <DropdownMenuItem onClick={onEdit}>
                                                    <Pencil />
                                                    Editar
                                                </DropdownMenuItem>
                                            ) : null}
                                            {canSync ? (
                                                <DropdownMenuItem onClick={onForceSync}>
                                                    <RotateCcw />
                                                    Forçar sincronização
                                                </DropdownMenuItem>
                                            ) : null}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : null}
                            </div>
                        </div>
                    </SheetHeader>

                    {row ? (
                        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                            {photo ? (
                                <button
                                    type="button"
                                    className="block w-full"
                                    onClick={() => setPhotoOpen(true)}
                                    aria-label="Ampliar foto"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária do R2 */}
                                    <img
                                        src={photo}
                                        alt="Foto enviada"
                                        className="aspect-square w-full rounded-xl object-cover"
                                    />
                                </button>
                            ) : (
                                <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-xl text-sm">
                                    {row.hasFacePhoto ? "Carregando foto…" : "Sem foto"}
                                </div>
                            )}
                            <dl>
                                <Field label="CPF">
                                    {row.document
                                        ? formatCpfOrCnpj(row.document)
                                        : "—"}
                                </Field>
                                <Field label="Telefone">
                                    <span className="inline-flex items-center justify-end gap-1">
                                        {row.phone ?? "—"}
                                        {contact ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="WhatsApp"
                                                    onClick={() =>
                                                        window.open(
                                                            `https://wa.me/${contact}`,
                                                            "_blank",
                                                            "noopener,noreferrer",
                                                        )
                                                    }
                                                >
                                                    <MessageCircle />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="Ligar"
                                                    onClick={() => {
                                                        window.location.href = `tel:+${contact}`;
                                                    }}
                                                >
                                                    <Phone />
                                                </Button>
                                            </>
                                        ) : null}
                                    </span>
                                </Field>
                                <Field label="Nascimento">
                                    {formatBirthDate(row.birthDate)}
                                </Field>
                                <Field label="Idade">
                                    {row.age == null ? "—" : `${row.age} anos`}
                                </Field>
                                <Field label="E-mail">{row.email ?? "—"}</Field>
                                <Field label="Local">{extraSummary(row)}</Field>
                                <Field label="Veracidade">
                                    {row.truthDeclaredAt
                                        ? `Aceita em ${formatWhen(row.truthDeclaredAt)}`
                                        : "Não registrada"}
                                </Field>
                                <Field label="Status">
                                    <Badge>{registrationStatusLabel(row.status)}</Badge>
                                </Field>
                            </dl>
                            {row.status === "rejected" ? (
                                <p className="text-destructive text-sm">
                                    Motivo: {row.rejectionNotes?.trim() || "—"}
                                    <span className="text-muted-foreground mt-1 block text-xs">
                                        Rejeitado em {formatWhen(row.approvedAt)}
                                    </span>
                                </p>
                            ) : null}
                            {row.status === "blocked" ? (
                                <p className="text-destructive text-sm">
                                    Motivo: {row.blockReason ?? "—"}
                                    <span className="text-muted-foreground mt-1 block text-xs">
                                        Bloqueado em {formatWhen(row.blockedAt)}
                                    </span>
                                </p>
                            ) : null}
                            <div className="space-y-2 text-sm">
                                <p className="text-muted-foreground">
                                    Última ocorrência
                                </p>
                                {eventsQuery.isLoading ? (
                                    <p className="text-muted-foreground text-xs">
                                        Carregando…
                                    </p>
                                ) : latest && latestMeta ? (
                                    <div>
                                        <p className="font-medium">
                                            {latestMeta.label}
                                        </p>
                                        {latest.body ? (
                                            <p className="whitespace-pre-wrap">
                                                {latest.body}
                                            </p>
                                        ) : null}
                                        <p className="text-muted-foreground text-xs">
                                            {latest.authorName ?? "Sistema"}
                                            {" · "}
                                            {formatWhen(latest.createdAt)}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-xs">
                                        Nenhuma ocorrência registrada.
                                    </p>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onHistory}
                                >
                                    Ver histórico
                                </Button>
                            </div>
                            {row.status === "approved" || row.status === "blocked" ? (
                                <div className="flex flex-col gap-2 text-sm">
                                    <p className="text-muted-foreground">
                                        Face ID no leitor:{" "}
                                        <span className="text-foreground font-medium">
                                            {row.faceId != null
                                                ? String(row.faceId)
                                                : "—"}
                                        </span>
                                    </p>
                                    {canSync ? (
                                        <DeviceSyncStatusBadge
                                            status={row.deviceSyncStatus}
                                            hasFace={row.faceId != null}
                                            hasReaders={row.hasFacialReaders}
                                            error={row.deviceSyncError}
                                            syncedCount={row.readerSyncSynced}
                                            totalCount={row.readerSyncTotal}
                                            isMinor={row.isMinor}
                                        />
                                    ) : null}
                                    {row.deviceSyncError ? (
                                        <p className="text-destructive text-xs">
                                            {row.deviceSyncError}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {row?.status === "draft" ? (
                        <SheetFooter className="shrink-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <div className="grid w-full grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="destructive"
                                    className="h-11"
                                    disabled={pending}
                                    onClick={onReject}
                                >
                                    Rejeitar
                                </Button>
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="outline"
                                    className="h-11"
                                    disabled={pending}
                                    onClick={onBlock}
                                >
                                    Bloquear
                                </Button>
                                <Button
                                    type="button"
                                    size="lg"
                                    className="h-11"
                                    disabled={pending}
                                    onClick={onApprove}
                                >
                                    Aprovar
                                </Button>
                            </div>
                        </SheetFooter>
                    ) : null}
                    {row?.status === "rejected" ? (
                        <SheetFooter className="shrink-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <Button
                                type="button"
                                size="lg"
                                className="h-11 w-full"
                                disabled={pending}
                                onClick={onApprove}
                            >
                                Aprovar
                            </Button>
                        </SheetFooter>
                    ) : null}
                    {row?.status === "approved" ? (
                        <SheetFooter className="shrink-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <div
                                className={
                                    canSync
                                        ? "grid w-full grid-cols-2 gap-2"
                                        : "grid w-full grid-cols-1 gap-2"
                                }
                            >
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="outline"
                                    className="h-11"
                                    disabled={pending}
                                    onClick={onBlock}
                                >
                                    Bloquear
                                </Button>
                                {canSync ? (
                                    <Button
                                        type="button"
                                        size="lg"
                                        className="h-11"
                                        disabled={pending || syncing}
                                        onClick={onSync}
                                    >
                                        {syncing ? "Sincronizando…" : "Sincronizar"}
                                    </Button>
                                ) : null}
                            </div>
                        </SheetFooter>
                    ) : null}
                    {row?.status === "blocked" ? (
                        <SheetFooter className="shrink-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <div
                                className={
                                    canSync
                                        ? "grid w-full grid-cols-2 gap-2"
                                        : "grid w-full grid-cols-1 gap-2"
                                }
                            >
                                <Button
                                    type="button"
                                    size="lg"
                                    className="h-11"
                                    disabled={pending}
                                    onClick={onUnblock}
                                >
                                    Desbloquear
                                </Button>
                                {canSync ? (
                                    <Button
                                        type="button"
                                        size="lg"
                                        variant="secondary"
                                        className="h-11"
                                        disabled={pending || syncing}
                                        onClick={onSync}
                                    >
                                        {syncing ? "Sincronizando…" : "Sincronizar"}
                                    </Button>
                                ) : null}
                            </div>
                        </SheetFooter>
                    ) : null}
                </SheetContent>
            </Sheet>

            <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
                <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-lg">
                    <DialogTitle className="sr-only">Foto enviada</DialogTitle>
                    {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária do R2
                        <img
                            src={photo}
                            alt="Foto enviada"
                            className="max-h-[80dvh] w-full object-contain"
                        />
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
