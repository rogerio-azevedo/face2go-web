"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    approveClientRegistrationAction,
    getClientRegistrationFaceUrlAction,
    rejectClientRegistrationAction,
    syncClientRegistrationFaceAction,
} from "@/app/client/usuarios/actions";
import {
    approveCompanyRegistrationAction,
    getCompanyRegistrationFaceUrlAction,
    rejectCompanyRegistrationAction,
    syncCompanyRegistrationFaceAction,
} from "@/app/company/clientes/[clientId]/usuarios/actions";
import type { ClientRegistrationListRow } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
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

type Tab = "draft" | "approved" | "rejected";

const TAB_LABELS: Record<Tab, string> = {
    draft: "Aguardando aprovação",
    approved: "Aprovados",
    rejected: "Rejeitados",
};

function formatWhen(iso: string | null) {
    if (!iso) return "—";
    try {
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function extraSummary(row: ClientRegistrationListRow): string {
    const d = row.additionalData;
    if (!d || typeof d !== "object") return "—";
    if ("block" in d && "unit" in d) {
        return `Bloco ${String(d.block)} · Unid. ${String(d.unit)}`;
    }
    if ("room" in d) {
        return `Sala ${String(d.room)}`;
    }
    return "—";
}

function syncStatusBadgeVariant(
    s: ClientRegistrationListRow["deviceSyncStatus"],
): "default" | "secondary" | "destructive" | "outline" {
    if (s === "synced") return "default";
    if (s === "pending_sync") return "secondary";
    if (s === "sync_failed") return "destructive";
    return "outline";
}

function syncStatusLabel(s: ClientRegistrationListRow["deviceSyncStatus"]) {
    if (s === "synced") return "Sincronizado";
    if (s === "pending_sync") return "Pendente";
    if (s === "sync_failed") return "Erro sync";
    return "—";
}

export function RegistrationsReviewBoard({
    variant,
    companyClientId,
    initialRows,
}: {
    variant: "client" | "company";
    companyClientId?: string;
    initialRows: ClientRegistrationListRow[];
}) {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("draft");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [activeRow, setActiveRow] = useState<ClientRegistrationListRow | null>(
        null,
    );
    const [faceUrl, setFaceUrl] = useState<string | null>(null);
    const [rejectNotes, setRejectNotes] = useState("");
    const [pending, startTransition] = useTransition();

    const filtered = useMemo(
        () => initialRows.filter((r) => r.status === tab),
        [initialRows, tab],
    );

    async function openDetail(row: ClientRegistrationListRow) {
        setActiveRow(row);
        setFaceUrl(null);
        setRejectNotes("");
        setSheetOpen(true);
        if (!row.hasFacePhoto) return;
        if (variant === "client") {
            const r = await getClientRegistrationFaceUrlAction(row.id);
            if ("url" in r) setFaceUrl(r.url);
            else toast.error(r.error);
        } else if (companyClientId) {
            const r = await getCompanyRegistrationFaceUrlAction(
                companyClientId,
                row.id,
            );
            if ("url" in r) setFaceUrl(r.url);
            else toast.error(r.error);
        }
    }

    function doApprove() {
        if (!activeRow) return;
        startTransition(async () => {
            const res =
                variant === "client"
                    ? await approveClientRegistrationAction(activeRow.id)
                    : await approveCompanyRegistrationAction(
                          companyClientId!,
                          activeRow.id,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Cadastro aprovado.");
            setSheetOpen(false);
            router.refresh();
        });
    }

    function doReject() {
        if (!activeRow) return;
        startTransition(async () => {
            const res =
                variant === "client"
                    ? await rejectClientRegistrationAction(
                          activeRow.id,
                          rejectNotes,
                      )
                    : await rejectCompanyRegistrationAction(
                          companyClientId!,
                          activeRow.id,
                          rejectNotes,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            toast.success("Cadastro rejeitado.");
            setSheetOpen(false);
            router.refresh();
        });
    }

    function runSyncFace(registrationId: string) {
        if (variant === "company" && !companyClientId) {
            toast.error("Cliente inválido.");
            return;
        }
        startTransition(async () => {
            const res =
                variant === "client"
                    ? await syncClientRegistrationFaceAction(registrationId)
                    : await syncCompanyRegistrationFaceAction(
                          companyClientId!,
                          registrationId,
                      );
            if ("error" in res) {
                toast.error(res.error);
                return;
            }
            if (res.deviceSyncStatus === "synced") {
                toast.success("Face sincronizada com o(s) leitor(es).");
            } else {
                toast.warning(
                    res.deviceSyncError ?? "Sync incompleta ou com avisos.",
                );
            }
            router.refresh();
        });
    }

    function doSyncActiveFace() {
        if (!activeRow) return;
        runSyncFace(activeRow.id);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {(Object.keys(TAB_LABELS) as Tab[]).map((k) => (
                    <Button
                        key={k}
                        type="button"
                        size="sm"
                        variant={tab === k ? "default" : "outline"}
                        onClick={() => setTab(k)}
                    >
                        {TAB_LABELS[k]}
                        <span className="ml-1.5 rounded-md bg-background/20 px-1.5 text-xs">
                            {initialRows.filter((r) => r.status === k).length}
                        </span>
                    </Button>
                ))}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead className="hidden sm:table-cell">
                                E-mail
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                                Local
                            </TableHead>
                            <TableHead>Enviado</TableHead>
                            <TableHead className="w-[100px] text-right">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    Nenhum registro nesta lista.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col gap-1">
                                            <span>{row.name ?? "—"}</span>
                                            {tab === "approved" &&
                                                row.faceId != null ? (
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px]"
                                                    >
                                                        ID leitor {row.faceId}
                                                    </Badge>
                                                    <Badge
                                                        variant={syncStatusBadgeVariant(
                                                            row.deviceSyncStatus,
                                                        )}
                                                        className="text-[10px]"
                                                    >
                                                        {syncStatusLabel(
                                                            row.deviceSyncStatus,
                                                        )}
                                                    </Badge>
                                                </div>
                                            ) : null}
                                            {tab === "approved" &&
                                                row.faceId == null &&
                                                !row.hasFacePhoto ? (
                                                <span className="text-muted-foreground text-[10px]">
                                                    Sem foto (não há envio ao
                                                    leitor)
                                                </span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden max-w-[200px] truncate text-xs sm:table-cell">
                                        {row.email ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden text-xs md:table-cell">
                                        {extraSummary(row)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatWhen(row.submittedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDetail(row)}
                                            >
                                                Ver
                                            </Button>
                                            {tab === "approved" &&
                                            row.faceId != null ? (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        runSyncFace(row.id)
                                                    }
                                                >
                                                    Sync leitor
                                                </Button>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>
                            {activeRow?.name ?? "Cadastro"}
                        </SheetTitle>
                        <SheetDescription>
                            {activeRow ? (
                                <>
                                    Documento: {activeRow.document ?? "—"} ·{" "}
                                    {activeRow.phone ?? "—"}
                                </>
                            ) : null}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-3 px-4">
                        {activeRow ? (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    E-mail: {activeRow.email ?? "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Local: {extraSummary(activeRow)}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        Status:
                                    </span>
                                    <Badge>
                                        {activeRow.status === "draft"
                                            ? "Aguardando"
                                            : activeRow.status === "approved"
                                              ? "Aprovado"
                                              : "Rejeitado"}
                                    </Badge>
                                </div>
                                {activeRow.status === "approved" ? (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs text-muted-foreground">
                                            Face ID no leitor:{" "}
                                            {activeRow.faceId != null
                                                ? String(activeRow.faceId)
                                                : "—"}
                                        </p>
                                        {activeRow.faceId != null ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    Sincronização:
                                                </span>
                                                <Badge
                                                    variant={syncStatusBadgeVariant(
                                                        activeRow.deviceSyncStatus,
                                                    )}
                                                    className="text-[10px]"
                                                >
                                                    {syncStatusLabel(
                                                        activeRow.deviceSyncStatus,
                                                    )}
                                                </Badge>
                                            </div>
                                        ) : null}
                                        {activeRow.deviceSyncError ? (
                                            <p className="text-destructive text-xs">
                                                {activeRow.deviceSyncError}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                                {faceUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária do R2
                                    <img
                                        src={faceUrl}
                                        alt="Foto enviada"
                                        className="max-h-64 w-full rounded-lg border object-contain"
                                    />
                                ) : activeRow.hasFacePhoto ? (
                                    <p className="text-xs text-muted-foreground">
                                        Carregando foto…
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Sem foto.
                                    </p>
                                )}
                                {activeRow.status === "draft" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="reject-notes">
                                            Motivo da rejeição (opcional)
                                        </Label>
                                        <textarea
                                            id="reject-notes"
                                            value={rejectNotes}
                                            onChange={(e) =>
                                                setRejectNotes(e.target.value)
                                            }
                                            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-[72px] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3"
                                            placeholder="Observação para o solicitante…"
                                        />
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                    </div>
                    {activeRow?.status === "draft" ? (
                        <SheetFooter className="flex-row flex-wrap gap-2 sm:justify-end">
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={pending}
                                onClick={doReject}
                            >
                                Rejeitar
                            </Button>
                            <Button
                                type="button"
                                disabled={pending}
                                onClick={doApprove}
                            >
                                Aprovar
                            </Button>
                        </SheetFooter>
                    ) : activeRow?.status === "approved" &&
                      activeRow.faceId != null ? (
                        <SheetFooter className="sm:justify-end">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={pending}
                                onClick={doSyncActiveFace}
                            >
                                Sincronizar leitor
                            </Button>
                        </SheetFooter>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    );
}
