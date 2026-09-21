"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Link2, MessageCircle, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
    createClientRegistrationLinkAction,
    deactivateClientRegistrationLinkAction,
    deleteClientRegistrationLinkAction,
} from "@/app/client/cadastros/actions";
import { CreateRegistrationLinkSheet } from "@/components/registrations/CreateRegistrationLinkSheet";
import {
    RegistrationLinkQrDialog,
    type RegistrationLinkQrTarget,
} from "@/features/registrations/components/RegistrationLinkQrDialog";
import type { RegistrationLinkListRow } from "@/types/domain";
import { registrationLinkVigenciaLabel } from "@/lib/registration-link-schedule";
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
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

function formatDate(iso: string | null) {
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

export function ClientRegistrationLinksPanel({
    initialLinks,
    clientName,
}: {
    initialLinks: RegistrationLinkListRow[];
    clientName: string;
}) {
    const router = useRouter();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const [lastCreated, setLastCreated] =
        useState<RegistrationLinkQrTarget | null>(null);
    const [qrTarget, setQrTarget] =
        useState<RegistrationLinkQrTarget | null>(null);
    const [linkToDelete, setLinkToDelete] =
        useState<RegistrationLinkListRow | null>(null);

    function copyText(text: string, message: string) {
        void navigator.clipboard.writeText(text).then(
            () => toast.success(message),
            () => toast.error("Não foi possível copiar."),
        );
    }

    function shareWhatsApp(url: string) {
        const text = encodeURIComponent(
            `Olá! Use este link para se cadastrar: ${url}`,
        );
        window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    }

    function deactivate(linkId: string) {
        startTransition(async () => {
            const result = await deactivateClientRegistrationLinkAction(linkId);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success("Link desativado.");
            router.refresh();
        });
    }

    function confirmDelete() {
        if (!linkToDelete) return;
        const target = linkToDelete;
        startTransition(async () => {
            const result = await deleteClientRegistrationLinkAction(target.id);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success("Link excluído.");
            setLinkToDelete(null);
            setLastCreated((prev) =>
                prev?.code === target.code ? null : prev,
            );
            router.refresh();
        });
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Button
                    type="button"
                    size="sm"
                    onClick={() => setSheetOpen(true)}
                >
                    <Link2 className="mr-2 size-4" />
                    Gerar link
                </Button>
            </div>
            <CreateRegistrationLinkSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                title="Novo link de cadastro"
                onSubmit={async (body) => {
                    const result =
                        await createClientRegistrationLinkAction(body);
                    if ("error" in result) {
                        return { ok: false as const, error: result.error };
                    }
                    setLastCreated({
                        url: result.registrationUrl,
                        code: result.code,
                    });
                    router.refresh();
                    return {
                        ok: true as const,
                        registrationUrl: result.registrationUrl,
                    };
                }}
            />
            {lastCreated ? (
                <div className="space-y-2 rounded-md border bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                        Último link gerado
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            readOnly
                            value={lastCreated.url}
                            className="font-mono text-xs"
                        />
                        <div className="flex shrink-0 gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    copyText(lastCreated.url, "Link copiado.")
                                }
                            >
                                <Copy className="mr-1 size-3.5" />
                                Copiar
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => shareWhatsApp(lastCreated.url)}
                            >
                                <MessageCircle className="mr-1 size-3.5" />
                                WhatsApp
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                aria-label="Cartaz QR"
                                onClick={() => setQrTarget(lastCreated)}
                            >
                                <QrCode className="mr-1 size-3.5" />
                                QR
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead className="hidden md:table-cell">
                                Criado em
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">
                                Vigência
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialLinks.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-sm text-muted-foreground"
                                >
                                    Nenhum link ainda. Clique em &quot;Gerar
                                    link&quot;.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialLinks.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-mono text-xs">
                                        {row.code}
                                    </TableCell>
                                    <TableCell className="hidden text-xs md:table-cell">
                                        {formatDate(row.createdAt)}
                                    </TableCell>
                                    <TableCell className="hidden text-xs lg:table-cell">
                                        {registrationLinkVigenciaLabel(row)}
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
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    copyText(
                                                        row.registrationUrl,
                                                        "Link copiado.",
                                                    )
                                                }
                                            >
                                                <Copy className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    shareWhatsApp(
                                                        row.registrationUrl,
                                                    )
                                                }
                                            >
                                                <MessageCircle className="size-4" />
                                            </Button>
                                            {row.isActive ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Cartaz QR"
                                                    title="Cartaz QR"
                                                    onClick={() =>
                                                        setQrTarget({
                                                            url: row.registrationUrl,
                                                            code: row.code,
                                                        })
                                                    }
                                                >
                                                    <QrCode className="size-4" />
                                                </Button>
                                            ) : null}
                                            {row.isActive ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        deactivate(row.id)
                                                    }
                                                >
                                                    Desativar
                                                </Button>
                                            ) : null}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                aria-label="Excluir link"
                                                title="Excluir"
                                                disabled={pending}
                                                onClick={() =>
                                                    setLinkToDelete(row)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    </Table>
            </div>
            <RegistrationLinkQrDialog
                open={qrTarget !== null}
                onOpenChange={(next) => {
                    if (!next) setQrTarget(null);
                }}
                clientName={clientName}
                target={qrTarget}
            />
            <AlertDialog
                open={linkToDelete != null}
                onOpenChange={(open) => {
                    if (!open && !pending) setLinkToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir link?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O link some da lista e o endereço deixa de
                            funcionar. Solicitações já recebidas continuam em
                            &quot;Solicitações recebidas&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pending}
                            variant="destructive"
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                        >
                            {pending ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
