"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Link2, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";

import {
    createClientRegistrationLinkAction,
    deactivateClientRegistrationLinkAction,
} from "@/app/client/usuarios/actions";
import { CreateRegistrationLinkSheet } from "@/components/registrations/CreateRegistrationLinkSheet";
import type { RegistrationLinkListRow } from "@/types/domain";
import { registrationLinkVigenciaLabel } from "@/lib/registration-link-schedule";
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
}: {
    initialLinks: RegistrationLinkListRow[];
}) {
    const router = useRouter();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null);

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-medium">
                            Novo link de cadastro
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Gere um link para enviar a moradores, colaboradores ou
                            visitantes. O formulário público será aberto ao clicar
                            no link.
                        </p>
                    </div>
                    <Button
                        type="button"
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
                        setLastCreatedUrl(result.registrationUrl);
                        router.refresh();
                        return {
                            ok: true as const,
                            registrationUrl: result.registrationUrl,
                        };
                    }}
                />
                {lastCreatedUrl ? (
                    <div className="space-y-2 rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            Último link gerado
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input readOnly value={lastCreatedUrl} className="font-mono text-xs" />
                            <div className="flex shrink-0 gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                        copyText(lastCreatedUrl, "Link copiado.")
                                    }
                                >
                                    <Copy className="mr-1 size-3.5" />
                                    Copiar
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => shareWhatsApp(lastCreatedUrl)}
                                >
                                    <MessageCircle className="mr-1 size-3.5" />
                                    WhatsApp
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="rounded-lg border bg-card shadow-sm">
                <div className="border-b px-4 py-3">
                    <h2 className="text-sm font-medium">Links gerados</h2>
                    <p className="text-xs text-muted-foreground">
                        Desative links antigos para impedir novos cadastros por
                        aquele endereço.
                    </p>
                </div>
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
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
